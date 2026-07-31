import { createAdminClient } from "@ecomstrait/db";
import { productImage } from "@/lib/catalog";
import type { StorePlan } from "@/lib/ecomai";
import { normalizePlan } from "@/lib/store-plan";

export type StorefrontProduct = {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  supplierId: string | null;
};

export type Storefront = {
  id: string;
  name: string;
  logoUrl: string | null;
  theme: string | null;
  status: string;
  plan: StorePlan;
  products: StorefrontProduct[];
};

/** Public storefront data (read via service role — no auth). */
export async function getStorefront(id: string): Promise<Storefront | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: store } = await admin
    .from("stores")
    .select("id, name, logo_url, theme, status, content, type")
    .eq("id", id)
    .maybeSingle();
  if (!store || store.type !== "own_platform") return null;

  // Only supplier-approved listings reach the public storefront.
  const { data: sp } = await admin
    .from("store_products")
    .select("product_id, price")
    .eq("store_id", id)
    .eq("status", "approved");
  const ids = (sp ?? []).map((r) => r.product_id);

  let products: StorefrontProduct[] = [];
  if (ids.length) {
    // Published-only, matching listStoreProducts: a supplier who unpublishes a
    // product has withdrawn it, and it must leave the grid here too — not just
    // from the API-driven pages.
    const { data: prods } = await admin
      .from("products")
      .select("id, title, images, retail_price, supplier_id")
      .in("id", ids)
      .eq("status", "published");
    const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));
    products = (prods ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      image: productImage(p.images?.[0]),
      price: priceMap.get(p.id) ?? p.retail_price,
      supplierId: p.supplier_id,
    }));
  }

  return {
    id: store.id,
    name: store.name ?? "Store",
    logoUrl: store.logo_url,
    theme: store.theme,
    status: store.status,
    plan: normalizePlan(store.content, store.name ?? "Store"),
    products,
  };
}
