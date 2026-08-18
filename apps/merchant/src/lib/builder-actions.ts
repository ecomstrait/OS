"use server";

import { redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient, type StoreType, type StoreStatus } from "@ecomstrait/db";
import { revalidatePath } from "next/cache";
import { assertTokenBudget, recordTokenUsage, assertCanCreateStore } from "@/lib/entitlements";
import { autoSelectProducts, getSelectedProducts, productImage } from "@/lib/catalog";
import { merchantUrl } from "@/lib/stripe";
import { resyncShopifyTheme } from "@/lib/shopify-actions";
import { generateStorePlan, applyMerchantRequest, themeForStyle, type StorePlan } from "@/lib/ecomai";
import { normalizePlan } from "@/lib/store-plan";
import { purgeStoreMedia } from "@/lib/draft-sweep";

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

/**
 * Talk to EcomAI about a store that hasn't launched yet.
 *
 * Returns the assistant's own words rather than a plan alone, so the builder
 * can say what actually happened instead of always printing "Updated".
 */
export async function refineStore(
  plan: StorePlan,
  instruction: string,
): Promise<{ plan?: StorePlan; reply?: string; changed?: string[]; error?: string }> {
  const budget = await assertTokenBudget(500);
  if (!budget.ok) return { error: budget.error };
  const res = await applyMerchantRequest(plan, instruction);
  await recordTokenUsage(res.tokensUsed);
  return { plan: res.plan, reply: res.reply, changed: res.changed };
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
  const ai = await applyMerchantRequest(current, instruction);
  const plan = ai.plan;
  await recordTokenUsage(ai.tokensUsed);

  // A question or a request we can't act on must not write to the store, nor
  // burn a version-history slot describing an edit that never happened.
  if (!ai.changed.length) {
    return { plan: current, synced: "live", note: ai.reply };
  }

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
    return { plan, synced: "live", note: `${ai.reply} Your live storefront is updated.` };
  }
  if (store.type === "shopify_liquid_theme" && store.shopify_store_id) {
    const res = await resyncShopifyTheme(storeId);
    if (res.error) return { plan, synced: "draft", note: `${ai.reply} But the Shopify sync failed: ${res.error}` };
    return { plan, synced: "shopify", note: `${ai.reply} Pushed to your live Shopify store.` };
  }
  return { plan, synced: "draft", note: `${ai.reply} Provision the store to publish it.` };
}

/**
 * Persist the launched-store settings that aren't part of the AI plan (name,
 * theme, logo). Cosmetic values still flow through `editStore`; this is the
 * action bar's "Save changes".
 */
export async function updateStore(
  storeId: string,
  input: {
    name: string;
    theme: string;
    logoUrl: string | null;
    /** The edited content plan. Omit to leave `stores.content` untouched. */
    content?: StorePlan;
  },
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
  const contentChanged =
    input.content !== undefined &&
    JSON.stringify(input.content) !== JSON.stringify(store.content ?? {});

  // Only snapshot when the look actually changes — renaming a store shouldn't
  // fill the history with visually identical entries.
  if (themeChanged || logoChanged || contentChanged) {
    await snapshotStore(
      supabase,
      storeId,
      { content: store.content, theme: store.theme, logo_url: store.logo_url },
      themeChanged ? `Theme → ${input.theme}` : contentChanged ? "Content edited" : "Logo changed",
    );
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name: input.name.trim() || "My Store",
      theme: input.theme || null,
      logo_url: input.logoUrl,
      ...(contentChanged ? { content: input.content as unknown as Record<string, unknown> } : {}),
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

/**
 * The store row the builder edits before Launch.
 *
 * It exists because the content editor and the media library both address a
 * store by id — an upload has to belong to something. Creating the row up
 * front is what lets a merchant assemble their store properly instead of
 * launching first and fixing the images afterwards.
 *
 * Reuses the merchant's newest draft rather than inserting per attempt. Someone
 * who rebuilds three times should end up with one row, not three, and keeping
 * the same id means the media they already uploaded is still there.
 *
 * `draftId` pins a specific draft — the builder passes the one it's resuming,
 * so a second tab can't quietly redirect the work into a different row.
 */
export async function ensureDraftStore(input: {
  draftId?: string | null;
  name: string;
  theme: string;
  logoUrl?: string | null;
  plan: StorePlan;
  products: { id: string; price: number | null }[];
}): Promise<{ storeId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const fields = {
    name: input.name.trim() || "My Store",
    theme: input.theme || null,
    logo_url: input.logoUrl ?? null,
    content: input.plan as unknown as Record<string, unknown>,
    draft_products: input.products,
  };

  // Guard on `launched_at` as well as ownership: once a draft has been launched
  // its row is a real store, and a stale builder tab must not write over it.
  // Status alone won't do — a launched Shopify store is 'draft' too.
  const reuse = async (id: string) =>
    supabase
      .from("stores")
      .update(fields)
      .eq("id", id)
      .eq("user_id", user.id)
      .is("launched_at", null)
      .select("id")
      .maybeSingle();

  if (input.draftId) {
    const { data } = await reuse(input.draftId);
    if (data) return { storeId: data.id };
    // The pinned draft was launched or swept — fall through and make a new one.
  }

  const { data: newest } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .is("launched_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (newest) {
    const { data } = await reuse(newest.id);
    if (data) return { storeId: data.id };
  }

  const { data: created, error } = await supabase
    .from("stores")
    .insert({
      user_id: user.id,
      // The selling path is chosen in the action bar, which the merchant may
      // not have touched yet. `type` is NOT NULL, so a draft holds the default
      // and Launch writes whatever they actually picked.
      type: "own_platform",
      status: "draft",
      ...fields,
    })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Could not save your draft." };

  return { storeId: created.id };
}

/**
 * Persist in-progress builder edits onto the draft.
 *
 * Doubles as the TTL heartbeat — `stores_touch_updated_at` moves `updated_at`
 * on every write, so a draft someone is actively working on can't be swept out
 * from under them.
 */
export async function saveDraft(
  storeId: string,
  input: {
    name: string;
    theme: string;
    logoUrl: string | null;
    plan: StorePlan;
    products: { id: string; price: number | null }[];
  },
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("stores")
    .update({
      name: input.name.trim() || "My Store",
      theme: input.theme || null,
      logo_url: input.logoUrl,
      content: input.plan as unknown as Record<string, unknown>,
      draft_products: input.products,
    })
    .eq("id", storeId)
    .eq("user_id", user.id)
    .is("launched_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  // No row means it's no longer a draft — launched in another tab, or swept.
  if (!data) return { error: "This draft is no longer available." };

  return { ok: true };
}

/** Throw away a draft and everything attached to it. */
export async function discardDraft(storeId: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Ownership is checked here so the media purge can't be aimed at someone
  // else's store by id; the delete below re-checks it against RLS anyway.
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .is("launched_at", null)
    .maybeSingle();
  if (!store) return { error: "Draft not found." };

  const admin = createAdminClient();
  if (admin) await purgeStoreMedia(admin, [storeId]);

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", storeId)
    .eq("user_id", user.id)
    .is("launched_at", null);
  if (error) return { error: error.message };

  revalidatePath("/stores");
  return { ok: true };
}

/**
 * Launch the store: persist plan + products; own-platform stores go live.
 *
 * `draftId` promotes the row the builder has been editing rather than inserting
 * a new one, so the media uploaded during the build stays attached to the store
 * that ends up live.
 */
export async function createStore(input: {
  draftId?: string | null;
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
  const fields = {
    name: input.name.trim() || "My Store",
    type: input.type,
    theme: input.theme || null,
    logo_url: input.logoUrl ?? null,
    content: input.plan as unknown as Record<string, unknown>,
    // A Shopify store isn't ready for anything until it's been provisioned —
    // claiming a shop, pushing products and uploading the theme. Marking it
    // ready_for_review here made launch look like it had done that work.
    status: (isOwn ? "live" : "draft") as StoreStatus,
    // The picks become real listings below, so the holding field is cleared.
    draft_products: [],
    // What separates a launched store from a builder draft. It also stops the
    // expiry sweep touching a Shopify store, which stays at status 'draft'
    // until it's been provisioned.
    launched_at: new Date().toISOString(),
  };

  let store: { id: string } | null = null;

  if (input.draftId) {
    // `.is("launched_at", null)` makes the promotion idempotent: a double-click
    // that gets past the button's disabled state finds nothing to update the
    // second time rather than launching the same store twice.
    const { data, error } = await supabase
      .from("stores")
      .update(fields)
      .eq("id", input.draftId)
      .eq("user_id", user.id)
      .is("launched_at", null)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "This store has already been launched." };
    store = data;
  }

  if (!store) {
    const { data, error } = await supabase
      .from("stores")
      .insert({ user_id: user.id, ...fields })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Could not launch store." };
    store = data;
  }

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
