"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { pushProductsToShopify } from "@/lib/shopify";
import {
  uploadAndPublishTheme,
  pushThemeSettings,
  settingsFromPlan,
  logoAssetFrom,
} from "@/lib/shopify-theme";
import { liquidThemeForStyle } from "@/lib/themes";
import { merchantUrl } from "@/lib/stripe";

/**
 * Provision a Shopify-path store: claim an available store from the pool,
 * link it, and push the AI-built products via the Admin API.
 * Requires a connected store in the pool (populated by the Shopify app on install).
 */
export async function provisionShopifyStore(storeId: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, type, shopify_store_id, theme, content, logo_url")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };
  if (!store.type.startsWith("shopify")) return { error: "Not a Shopify store." };

  const admin = createAdminClient();
  if (!admin) return { error: "Server not configured." };

  // Use the already-linked pool store, or claim an available one.
  let sid = store.shopify_store_id;
  const claimedNow = !sid;
  if (!sid) {
    const { data: avail } = await admin
      .from("shopify_stores")
      .select("id")
      .eq("status", "available")
      .not("access_token", "is", null)
      .limit(1)
      .maybeSingle();
    if (!avail) return { error: "No connected Shopify store available. Install the app on a dev store first." };
    sid = avail.id;
    await admin
      .from("shopify_stores")
      .update({ status: "building", owner_user_id: user.id, assigned_at: new Date().toISOString() })
      .eq("id", sid);
    await supabase.from("stores").update({ shopify_store_id: sid }).eq("id", storeId);
  }

  const { data: shopRow } = await admin
    .from("shopify_stores")
    .select("shop_domain, access_token")
    .eq("id", sid)
    .maybeSingle();
  if (!shopRow?.access_token) return { error: "That Shopify store has no access token." };

  // Build the product list from the store's catalog — supplier-approved only.
  const { data: sp } = await admin
    .from("store_products")
    .select("product_id, price")
    .eq("store_id", storeId)
    .eq("status", "approved");
  const ids = (sp ?? []).map((r) => r.product_id);
  const { data: prods } = ids.length
    ? await admin.from("products").select("id, title, description").in("id", ids)
    : { data: [] };
  const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));
  const pushList = (prods ?? []).map((p) => ({
    title: p.title,
    price: priceMap.get(p.id) ?? null,
    description: p.description ?? null,
    sku: p.id, // lets the order webhook map back to our product
  }));

  /** Put a freshly-claimed shop back in the pool so a failure doesn't strand it. */
  async function releaseClaim() {
    if (!claimedNow || !sid) return;
    await admin!
      .from("shopify_stores")
      .update({ status: "available", owner_user_id: null, assigned_at: null })
      .eq("id", sid)
      .neq("status", "transferred");
    await supabase.from("stores").update({ shopify_store_id: null }).eq("id", storeId);
  }

  let result: { created: number; errors: string[] };
  try {
    result = await pushProductsToShopify(shopRow.shop_domain, shopRow.access_token, pushList);
  } catch (e) {
    await releaseClaim();
    return { error: `Couldn't reach Shopify: ${e instanceof Error ? e.message : "unknown error"}` };
  }

  // Path 2 (shopify_liquid_theme): upload + publish our Liquid theme with the
  // store's brand settings. Requires the write_themes scope and a publicly
  // reachable NEXT_PUBLIC_MERCHANT_URL (Shopify fetches the theme zip).
  let themeNote = "";
  let themeGid: string | null = null;
  if (store.type === "shopify_liquid_theme") {
    const liquid = liquidThemeForStyle(store.theme);
    const plan = store.content as {
      brandColors?: string[];
      heroHeadline?: string;
      heroSub?: string;
      tagline?: string;
    } | null;
    let themeRes: Awaited<ReturnType<typeof uploadAndPublishTheme>>;
    try {
      themeRes = await uploadAndPublishTheme(shopRow.shop_domain, shopRow.access_token, {
        themeName: liquid.name,
        sourceUrl: `${merchantUrl()}/api/themes/${liquid.id}`,
        settings: settingsFromPlan(plan),
        logo: logoAssetFrom(store.logo_url),
      });
    } catch (e) {
      themeRes = { ok: false, error: e instanceof Error ? e.message : "theme upload threw" };
    }

    if (themeRes.ok) {
      themeGid = themeRes.themeGid;
      themeNote = " + theme";
    } else {
      // A liquid-theme store without its theme isn't provisioned. Reporting
      // success here is what left stores linked but themeless, with the
      // Provision button gone and re-sync insisting the theme was missing.
      await admin
        .from("shopify_stores")
        .update({ sync_status: `theme upload failed: ${themeRes.error}` })
        .eq("id", sid);
      return {
        error: `Products pushed, but the theme upload failed: ${themeRes.error}. Fix that and provision again.`,
      };
    }
  }

  await supabase
    .from("stores")
    .update({ status: "ready_for_review", live_url: `https://${shopRow.shop_domain}` })
    .eq("id", storeId);
  await admin
    .from("shopify_stores")
    .update({
      status: "ready_for_review",
      sync_status: `pushed ${result.created} products${themeNote}`,
      ...(themeGid ? { theme_id: themeGid } : {}),
    })
    .eq("id", sid);

  revalidatePath("/stores");
  return { ok: true };
}

/**
 * Re-sync EcomAI cosmetic edits to a LIVE Shopify store: push the current plan
 * (colors, hero, logo from `stores.content`) onto the already-published theme
 * via themeFilesUpsert. No re-create/re-publish — fast and safe.
 */
export async function resyncShopifyTheme(storeId: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, type, shopify_store_id, content, logo_url")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };
  if (store.type !== "shopify_liquid_theme") {
    return { error: "Only EcomStrait-theme Shopify stores can be re-synced." };
  }
  if (!store.shopify_store_id) return { error: "Provision the store on Shopify first." };

  const admin = createAdminClient();
  if (!admin) return { error: "Server not configured." };

  const { data: shopRow } = await admin
    .from("shopify_stores")
    .select("shop_domain, access_token, theme_id")
    .eq("id", store.shopify_store_id)
    .maybeSingle();
  if (!shopRow?.access_token) return { error: "That Shopify store has no access token." };
  if (!shopRow.theme_id) {
    return {
      error:
        "No theme on this store yet — the upload didn't complete. Use \u201cRetry provisioning\u201d on the Stores page, then update again.",
    };
  }

  const plan = store.content as {
    brandColors?: string[];
    heroHeadline?: string;
    heroSub?: string;
    tagline?: string;
  } | null;

  const res = await pushThemeSettings(
    shopRow.shop_domain,
    shopRow.access_token,
    shopRow.theme_id,
    settingsFromPlan(plan),
    logoAssetFrom(store.logo_url),
  );
  if (!res.ok) return { error: res.error };

  await admin
    .from("shopify_stores")
    .update({ sync_status: "settings re-synced" })
    .eq("id", store.shopify_store_id);

  revalidatePath("/stores");
  return { ok: true };
}
