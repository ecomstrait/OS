import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";

export type CatalogProduct = {
  id: string;
  title: string;
  category: string | null;
  images: string[];
  retail_price: number | null;
  wholesale_price: number | null;
  supplier_id: string;
  supplier_name: string;
};

const SELECT = "id, title, category, images, retail_price, wholesale_price, supplier_id";

export function productImage(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/product-images/${path}` : null;
}

async function withSupplierNames(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  rows: Omit<CatalogProduct, "supplier_name">[],
): Promise<CatalogProduct[]> {
  const supIds = [...new Set(rows.map((p) => p.supplier_id))];
  const names = new Map<string, string>();
  if (supIds.length) {
    const { data } = await admin.from("suppliers").select("id, business_name").in("id", supIds);
    (data ?? []).forEach((s) => names.set(s.id, s.business_name ?? "Supplier"));
  }
  return rows.map((p) => ({ ...p, supplier_name: names.get(p.supplier_id) ?? "Supplier" }));
}

/** Published products across approved suppliers (optionally filtered). */
export async function getPublishedCatalog(search?: string): Promise<CatalogProduct[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  let q = admin
    .from("products")
    .select(SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  if (search?.trim()) q = q.ilike("title", `%${search.trim()}%`);
  const { data } = await q;
  return withSupplierNames(admin, data ?? []);
}

/** Auto-pick published products that fit a niche (falls back to any published). */
export async function autoSelectProducts(niche: string, limit = 8): Promise<CatalogProduct[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const term = niche
    .toLowerCase()
    .split(/\s+/)
    .find((w) => w.length > 2);

  let rows: Omit<CatalogProduct, "supplier_name">[] = [];
  if (term) {
    const { data } = await admin
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .or(`title.ilike.%${term}%,category.ilike.%${term}%`)
      .limit(limit);
    rows = data ?? [];
  }
  if (rows.length === 0) {
    const { data } = await admin
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    rows = data ?? [];
  }
  return withSupplierNames(admin, rows.slice(0, limit));
}

/** The set of product ids the current user has selected. */
export async function getSelectedIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from("selected_products").select("product_id").eq("user_id", user.id);
  return new Set((data ?? []).map((r) => r.product_id));
}

/** The current user's selected products, with details. */
export async function getSelectedProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: sel } = await supabase.from("selected_products").select("product_id").eq("user_id", user.id);
  const ids = (sel ?? []).map((r) => r.product_id);
  if (!ids.length) return [];

  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin.from("products").select(SELECT).in("id", ids);
  return withSupplierNames(admin, data ?? []);
}
