import { createClient } from "@ecomstrait/auth/server";
import type { ListingStatus } from "@ecomstrait/db/types";

export type StoreOption = { id: string; name: string };
/** productId → the merchant's listing state for it, per store. */
export type ListingMap = Record<string, Record<string, ListingStatus>>;

/** The current merchant's stores, newest first. */
export async function getMerchantStores(): Promise<StoreOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("stores")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((s) => ({ id: s.id, name: s.name ?? "Untitled store" }));
}

/**
 * Listing state for a page of products in one query, rather than one lookup per
 * card. Returns `{}` when the merchant has no stores yet.
 */
export async function getListingsFor(productIds: string[]): Promise<ListingMap> {
  if (!productIds.length) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: stores } = await supabase.from("stores").select("id").eq("user_id", user.id);
  const storeIds = (stores ?? []).map((s) => s.id);
  if (!storeIds.length) return {};

  const { data } = await supabase
    .from("store_products")
    .select("store_id, product_id, status")
    .in("store_id", storeIds)
    .in("product_id", productIds);

  const map: ListingMap = {};
  for (const row of data ?? []) {
    (map[row.product_id] ??= {})[row.store_id] = row.status;
  }
  return map;
}
