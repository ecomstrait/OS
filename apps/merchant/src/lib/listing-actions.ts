"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { wipeStoreContent } from "@/lib/shopify";
import type { ListingStatus } from "@ecomstrait/db/types";

export type MerchantStore = {
  id: string;
  name: string;
  /** This product's state on that store, or null when it isn't listed there. */
  listing: ListingStatus | null;
};

/**
 * The merchant's stores, annotated with where `productId` already stands on
 * each — so the "Add to store" menu can show Pending / Listed instead of
 * offering a duplicate.
 */
export async function getStoresForProduct(productId: string): Promise<MerchantStore[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!stores?.length) return [];

  const { data: listings } = await supabase
    .from("store_products")
    .select("store_id, status")
    .eq("product_id", productId)
    .in(
      "store_id",
      stores.map((s) => s.id),
    );

  const byStore = new Map((listings ?? []).map((l) => [l.store_id, l.status]));
  return stores.map((s) => ({
    id: s.id,
    name: s.name ?? "Untitled store",
    listing: byStore.get(s.id) ?? null,
  }));
}

/**
 * Request that a supplier's product be listed on one of the merchant's stores.
 * Creates a PENDING row — nothing reaches the storefront or Shopify until the
 * supplier approves it.
 */
export async function requestListing(
  storeId: string,
  productId: string,
): Promise<{ error?: string; status?: ListingStatus }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  // The catalog is cross-tenant, so the product and its price come from the
  // admin client — a merchant can't read another supplier's rows directly.
  const admin = createAdminClient();
  if (!admin) return { error: "Server not configured." };
  const { data: product } = await admin
    .from("products")
    .select("id, supplier_id, retail_price, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { error: "Product not found." };
  if (product.status !== "published") return { error: "That product isn't published." };

  const { error } = await supabase.from("store_products").upsert(
    {
      store_id: storeId,
      product_id: productId,
      supplier_id: product.supplier_id,
      price: product.retail_price,
      status: "pending" as ListingStatus,
    },
    { onConflict: "store_id,product_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/find-suppliers");
  revalidatePath("/inventory");
  revalidatePath(`/stores/${storeId}`);
  return { status: "pending" };
}

/** Remove a listing (or withdraw a pending request) from one of the merchant's stores. */
export async function removeListing(
  storeId: string,
  productId: string,
): Promise<{ error?: string; note?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  // Pull it from Shopify BEFORE deleting the row — the row holds the only link
  // to the Shopify product, so deleting first would strand it there for good.
  // Custom-website storefronts need nothing: they read approved listings live.
  let note: string | undefined;
  const admin = createAdminClient();
  if (admin) {
    const { data: listing } = await admin
      .from("store_products")
      .select("shopify_product_id")
      .eq("store_id", storeId)
      .eq("product_id", productId)
      .maybeSingle();

    if (listing?.shopify_product_id) {
      const { data: full } = await admin
        .from("stores")
        .select("shopify_store_id")
        .eq("id", storeId)
        .maybeSingle();
      const { data: shop } = full?.shopify_store_id
        ? await admin
            .from("shopify_stores")
            .select("shop_domain, access_token")
            .eq("id", full.shopify_store_id)
            .maybeSingle()
        : { data: null };

      if (shop?.access_token) {
        const wipe = await wipeStoreContent(shop.shop_domain, shop.access_token, {
          productIds: [listing.shopify_product_id],
        });
        // Leaving the row would strand the listing in our UI too, so the delete
        // proceeds either way — but say so rather than claiming a clean removal.
        if (wipe.errors.length) {
          note = "Removed here, but it may still be visible on Shopify — check the store.";
        }
      }
    }
  }

  const { error } = await supabase
    .from("store_products")
    .delete()
    .eq("store_id", storeId)
    .eq("product_id", productId);
  if (error) return { error: error.message };

  revalidatePath("/find-suppliers");
  revalidatePath("/inventory");
  revalidatePath(`/store/${storeId}`);
  return note ? { note } : {};
}
