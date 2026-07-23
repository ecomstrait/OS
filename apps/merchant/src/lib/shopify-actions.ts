"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { pushProductsToShopify } from "@/lib/shopify";

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
    .select("id, type, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };
  if (!store.type.startsWith("shopify")) return { error: "Not a Shopify store." };

  const admin = createAdminClient();
  if (!admin) return { error: "Server not configured." };

  // Use the already-linked pool store, or claim an available one.
  let sid = store.shopify_store_id;
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

  // Build the product list from the store's catalog.
  const { data: sp } = await admin.from("store_products").select("product_id, price").eq("store_id", storeId);
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

  const result = await pushProductsToShopify(shopRow.shop_domain, shopRow.access_token, pushList);

  await supabase
    .from("stores")
    .update({ status: "ready_for_review", live_url: `https://${shopRow.shop_domain}` })
    .eq("id", storeId);
  await admin
    .from("shopify_stores")
    .update({ status: "ready_for_review", sync_status: `pushed ${result.created} products` })
    .eq("id", sid);

  revalidatePath("/stores");
  return { ok: true };
}
