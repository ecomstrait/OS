"use server";

import { redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreType } from "@ecomstrait/db";
import { assertTokenBudget, recordTokenUsage, assertCanCreateStore } from "@/lib/entitlements";
import { autoSelectProducts, productImage } from "@/lib/catalog";
import { merchantUrl } from "@/lib/stripe";
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
