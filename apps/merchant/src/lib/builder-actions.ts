"use server";

import { redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient, type StoreType } from "@ecomstrait/db";
import { revalidatePath } from "next/cache";
import { assertTokenBudget, recordTokenUsage, assertCanCreateStore } from "@/lib/entitlements";
import { autoSelectProducts, getSelectedProducts, productImage } from "@/lib/catalog";
import { merchantUrl } from "@/lib/stripe";
import { resyncShopifyTheme } from "@/lib/shopify-actions";
import { generateStorePlan, refineStorePlan, themeForStyle, type StorePlan } from "@/lib/ecomai";
import { normalizePlan } from "@/lib/store-plan";

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

/**
 * Co-founder build: generate the full plan + SEO + theme.
 *
 * `useSelected` means the merchant arrived from Find Suppliers with products
 * already chosen — build around those instead of auto-picking for the niche.
 */
export async function buildStore(
  answers: BuilderAnswers,
  opts: { useSelected?: boolean } = {},
): Promise<BuildResult> {
  const budget = await assertTokenBudget(1500);
  if (!budget.ok) return { error: budget.error };

  const chosen = opts.useSelected ? await getSelectedProducts() : [];
  if (!opts.useSelected && answers.niche.trim().length < 2) {
    return { error: "Tell me what you want to sell first." };
  }

  // Fall back to auto-pick if the basket emptied between pages.
  const picked = chosen.length ? chosen : await autoSelectProducts(answers.niche, 8);

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

/** Snapshots kept per store; older ones are pruned on each write. */
const VERSION_LIMIT = 20;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Record a store's current look before it gets overwritten, then trim the
 * history to VERSION_LIMIT. Best-effort: a failure here must never block the
 * edit the merchant actually asked for.
 */
async function snapshotStore(
  supabase: SupabaseServerClient,
  storeId: string,
  before: { content: unknown; theme: string | null; logo_url: string | null },
  label: string,
): Promise<void> {
  try {
    await supabase.from("store_theme_versions").insert({
      store_id: storeId,
      content: (before.content ?? {}) as Record<string, unknown>,
      theme: before.theme,
      logo_url: before.logo_url,
      label: label.slice(0, 200),
    });

    const { data: keep } = await supabase
      .from("store_theme_versions")
      .select("id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(VERSION_LIMIT);

    const keepIds = (keep ?? []).map((r) => r.id);
    if (keepIds.length === VERSION_LIMIT) {
      await supabase
        .from("store_theme_versions")
        .delete()
        .eq("store_id", storeId)
        .not("id", "in", `(${keepIds.join(",")})`);
    }
  } catch {
    // History is a convenience, not a correctness requirement.
  }
}

export type StoreVersion = {
  id: string;
  label: string | null;
  createdAt: string;
};

/** Recent snapshots for a store, newest first. */
export async function listStoreVersions(storeId: string): Promise<StoreVersion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return [];

  const { data } = await supabase
    .from("store_theme_versions")
    .select("id, label, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(VERSION_LIMIT);

  return (data ?? []).map((v) => ({ id: v.id, label: v.label, createdAt: v.created_at }));
}

/**
 * Restore a snapshot. The current look is snapshotted first, so a restore is
 * itself undoable, and the result is re-synced to Shopify like any other edit.
 */
export async function restoreStoreVersion(
  storeId: string,
  versionId: string,
): Promise<{ plan?: StorePlan; note?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, type, content, theme, logo_url, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  const { data: version } = await supabase
    .from("store_theme_versions")
    .select("id, content, theme, logo_url, created_at")
    .eq("id", versionId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!version) return { error: "That version is no longer available." };

  await snapshotStore(
    supabase,
    storeId,
    { content: store.content, theme: store.theme, logo_url: store.logo_url },
    "Before restore",
  );

  const { error: upErr } = await supabase
    .from("stores")
    .update({
      content: version.content,
      theme: version.theme,
      logo_url: version.logo_url,
    })
    .eq("id", storeId)
    .eq("user_id", user.id);
  if (upErr) return { error: upErr.message };

  revalidatePath(`/store/${storeId}`);
  revalidatePath("/stores");

  const plan = normalizePlan(version.content);

  if (store.type === "shopify_liquid_theme" && store.shopify_store_id) {
    const res = await resyncShopifyTheme(storeId);
    if (res.error) return { plan, note: `Restored, but the Shopify sync failed: ${res.error}` };
    return { plan, note: "Restored and pushed to your live Shopify store." };
  }
  return { plan, note: "Restored." };
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
    .select("id, type, content, theme, logo_url, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  const budget = await assertTokenBudget(500);
  if (!budget.ok) return { error: budget.error };

  const current = normalizePlan(store.content);
  const { plan, tokensUsed } = await refineStorePlan(current, instruction);
  await recordTokenUsage(tokensUsed);

  // Capture the pre-edit look so this change can be undone.
  await snapshotStore(
    supabase,
    storeId,
    { content: store.content, theme: store.theme, logo_url: store.logo_url },
    instruction.trim(),
  );

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

/**
 * Persist the launched-store settings that aren't part of the AI plan (name,
 * theme, logo). Cosmetic values still flow through `editStore`; this is the
 * action bar's "Save changes".
 */
export async function updateStore(
  storeId: string,
  input: { name: string; theme: string; logoUrl: string | null },
): Promise<{ error?: string; note?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, type, theme, content, logo_url, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  const themeChanged = Boolean(input.theme) && input.theme !== store.theme;
  const logoChanged = (input.logoUrl ?? null) !== store.logo_url;

  // Only snapshot when the look actually changes — renaming a store shouldn't
  // fill the history with visually identical entries.
  if (themeChanged || logoChanged) {
    await snapshotStore(
      supabase,
      storeId,
      { content: store.content, theme: store.theme, logo_url: store.logo_url },
      themeChanged ? `Theme → ${input.theme}` : "Logo changed",
    );
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name: input.name.trim() || "My Store",
      theme: input.theme || null,
      logo_url: input.logoUrl,
    })
    .eq("id", storeId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/store/${storeId}`);
  revalidatePath("/stores");

  // Push the logo/colour settings onto an already-published Shopify theme.
  if (store.type === "shopify_liquid_theme" && store.shopify_store_id) {
    const res = await resyncShopifyTheme(storeId);
    if (res.error) return { note: `Saved, but the Shopify sync failed: ${res.error}` };
    // A different theme id means a different Liquid package, which only gets
    // installed by a fresh provision — re-syncing settings can't swap it.
    return {
      note: themeChanged
        ? "Saved and re-synced. The new theme design applies the next time this store is provisioned."
        : "Saved and pushed to your live Shopify store.",
    };
  }

  return { note: "Saved." };
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
      // A Shopify store isn't ready for anything until it's been provisioned —
      // claiming a shop, pushing products and uploading the theme. Marking it
      // ready_for_review here made launch look like it had done that work.
      status: isOwn ? "live" : "draft",
    })
    .select("id")
    .single();
  if (error || !store) return { error: error?.message ?? "Could not launch store." };

  if (input.products.length) {
    // Listings start pending and carry their supplier, so each one lands in that
    // supplier's approval queue rather than going live unreviewed.
    const admin = createAdminClient();
    const supplierByProduct = new Map<string, string>();
    if (admin) {
      const { data: owned } = await admin
        .from("products")
        .select("id, supplier_id")
        .in(
          "id",
          input.products.map((p) => p.id),
        );
      (owned ?? []).forEach((p) => supplierByProduct.set(p.id, p.supplier_id));
    }

    await supabase.from("store_products").insert(
      input.products.map((p) => ({
        store_id: store.id,
        product_id: p.id,
        price: p.price,
        supplier_id: supplierByProduct.get(p.id) ?? null,
        status: "pending" as const,
      })),
    );
  }

  if (isOwn) {
    await supabase.from("stores").update({ live_url: `${merchantUrl()}/store/${store.id}` }).eq("id", store.id);
  }

  redirect("/stores");
}
