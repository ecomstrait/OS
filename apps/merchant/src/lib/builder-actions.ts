"use server";

import { redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreType } from "@ecomstrait/db";
import { revalidatePath } from "next/cache";
import { assertTokenBudget, recordTokenUsage, assertCanCreateStore } from "@/lib/entitlements";
import { autoSelectProducts, productImage } from "@/lib/catalog";
import { merchantUrl } from "@/lib/stripe";
import { resyncShopifyTheme } from "@/lib/shopify-actions";
import { generateStorePlan, refineStorePlan, themeForStyle, type StorePlan } from "@/lib/ecomai";

export type BuilderAnswers = {
  niche: string;
  audience?: string;
  style?: string;
  storeName?: string;
};

export type PreviewProduct = { id: string; title: string; price: number | null; image: string | null };

export type BuildResult = {
  plan?: StorePlan;
  products?: PreviewProduct[];
  theme?: string;
  error?: string;
};

/** Co-founder build: auto-pick products, generate the full plan + SEO + theme. */
export async function buildStore(answers: BuilderAnswers): Promise<BuildResult> {
  if (answers.niche.trim().length < 2) return { error: "Tell me what you want to sell first." };

  const budget = await assertTokenBudget(1500);
  if (!budget.ok) return { error: budget.error };

  const picked = await autoSelectProducts(answers.niche, 8);

  const idea = [
    `Business: ${answers.niche}`,
    answers.audience ? `Customers: ${answers.audience}` : "",
    answers.style ? `Style: ${answers.style}` : "",
    answers.storeName && !/you pick|surprise|any/i.test(answers.storeName) ? `Preferred name: ${answers.storeName}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const { plan, tokensUsed } = await generateStorePlan(idea, picked.map((p) => p.title));
  await recordTokenUsage(tokensUsed);

  if (answers.storeName && !/you pick|surprise|any/i.test(answers.storeName)) {
    plan.storeName = answers.storeName.trim();
  }

  const products: PreviewProduct[] = picked.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.retail_price,
    image: productImage(p.images?.[0]),
  }));

  return { plan, products, theme: themeForStyle(answers.style) };
}

/** Cosmetic-only refinement after the store is built. */
export async function refineStore(
  plan: StorePlan,
  instruction: string,
): Promise<{ plan?: StorePlan; error?: string }> {
  const budget = await assertTokenBudget(500);
  if (!budget.ok) return { error: budget.error };
  const { plan: updated, tokensUsed } = await refineStorePlan(plan, instruction);
  await recordTokenUsage(tokensUsed);
  return { plan: updated };
}

export type EditResult = {
  plan?: StorePlan;
  synced?: "live" | "shopify" | "draft";
  note?: string;
  error?: string;
};

/**
 * Post-launch EcomAI edit: refine the persisted plan, save it, and auto-propagate
 * to the live surface — own-platform storefronts read `content` live; Shopify
 * Liquid stores get a themeFilesUpsert re-sync. Cosmetic (colors/text/logo) only.
 */
export async function editStore(storeId: string, instruction: string): Promise<EditResult> {
  if (instruction.trim().length < 2) return { error: "Tell me what to change." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, type, content, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  const budget = await assertTokenBudget(500);
  if (!budget.ok) return { error: budget.error };

  const current = store.content as unknown as StorePlan;
  const { plan, tokensUsed } = await refineStorePlan(current, instruction);
  await recordTokenUsage(tokensUsed);

  const { error: upErr } = await supabase
    .from("stores")
    .update({ content: plan as unknown as Record<string, unknown> })
    .eq("id", storeId);
  if (upErr) return { error: upErr.message };

  revalidatePath(`/store/${storeId}`);
  revalidatePath("/stores");

  // Auto-propagate to wherever the store is live.
  if (store.type === "own_platform") {
    return { plan, synced: "live", note: "Your live storefront is updated." };
  }
  if (store.type === "shopify_liquid_theme" && store.shopify_store_id) {
    const res = await resyncShopifyTheme(storeId);
    if (res.error) return { plan, synced: "draft", note: `Saved, but Shopify sync failed: ${res.error}` };
    return { plan, synced: "shopify", note: "Pushed to your live Shopify store." };
  }
  return { plan, synced: "draft", note: "Saved. Provision the store to publish these changes." };
}

/** Launch the store: persist plan + products; own-platform stores go live. */
export async function createStore(input: {
  name: string;
  type: StoreType;
  theme: string;
  logoUrl?: string | null;
  plan: StorePlan;
  products: { id: string; price: number | null }[];
}): Promise<{ error?: string } | never> {
  const gate = await assertCanCreateStore();
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const isOwn = input.type === "own_platform";
  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      user_id: user.id,
      name: input.name.trim() || "My Store",
      type: input.type,
      theme: input.theme || null,
      logo_url: input.logoUrl ?? null,
      content: input.plan as unknown as Record<string, unknown>,
      status: isOwn ? "live" : "ready_for_review",
    })
    .select("id")
    .single();
  if (error || !store) return { error: error?.message ?? "Could not launch store." };

  if (input.products.length) {
    await supabase
      .from("store_products")
      .insert(input.products.map((p) => ({ store_id: store.id, product_id: p.id, price: p.price })));
  }

  if (isOwn) {
    await supabase.from("stores").update({ live_url: `${merchantUrl()}/store/${store.id}` }).eq("id", store.id);
  }

  redirect("/stores");
}
