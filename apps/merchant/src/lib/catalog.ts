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
  /** Units a merchant could actually sell today. */
  available: number;
  /** Supplier's platform quality score, 0-100, when scored. */
  supplier_score: number | null;
};

/** Per-unit economics a merchant judges a product on. */
export type ProductEconomics = {
  cost: number | null;
  retail: number | null;
  profit: number | null;
  marginPct: number | null;
};

export function economicsFor(p: {
  retail_price: number | null;
  wholesale_price: number | null;
}): ProductEconomics {
  const retail = p.retail_price;
  const cost = p.wholesale_price;
  if (retail == null || cost == null || retail <= 0) {
    return { cost, retail, profit: null, marginPct: null };
  }
  const profit = Math.round((retail - cost) * 100) / 100;
  return { cost, retail, profit, marginPct: Math.round((profit / retail) * 100) };
}

const SELECT =
  "id, title, category, images, retail_price, wholesale_price, supplier_id, stock, reserved";

export function productImage(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/product-images/${path}` : null;
}

type RawProduct = Omit<CatalogProduct, "supplier_name" | "available" | "supplier_score"> & {
  stock?: number | null;
  reserved?: number | null;
};

async function withSupplierNames(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  rows: RawProduct[],
): Promise<CatalogProduct[]> {
  const supIds = [...new Set(rows.map((p) => p.supplier_id))];
  const names = new Map<string, string>();
  const scores = new Map<string, number | null>();
  if (supIds.length) {
    const { data } = await admin
      .from("suppliers")
      .select("id, business_name, quality_score")
      .in("id", supIds);
    (data ?? []).forEach((s) => {
      names.set(s.id, s.business_name ?? "Supplier");
      scores.set(s.id, s.quality_score);
    });
  }
  return rows.map((p) => ({
    ...p,
    supplier_name: names.get(p.supplier_id) ?? "Supplier",
    supplier_score: scores.get(p.supplier_id) ?? null,
    available: Math.max(0, (p.stock ?? 0) - (p.reserved ?? 0)),
  }));
}

export type CatalogFilters = {
  /** Free-text match on the product title. */
  search?: string;
  /** A supplier id, or "" / undefined for all suppliers. */
  supplierId?: string;
  /** A product category ("niche"), or "" / undefined for all. */
  category?: string;
};

/** Strip LIKE wildcards so a typed `%` matches literally rather than everything. */
function likeSafe(term: string): string {
  return term.replace(/[%_\\]/g, " ").trim().slice(0, 80);
}

export type CatalogPage = { products: CatalogProduct[]; total: number };

/**
 * One page of published products across approved suppliers. `total` is the full
 * filtered count, so the pager can show "1–24 of 312" rather than capping at
 * whatever fits on screen.
 */
export async function getPublishedCatalog(
  filters: CatalogFilters = {},
  range?: { from: number; to: number },
): Promise<CatalogPage> {
  const admin = createAdminClient();
  if (!admin) return { products: [], total: 0 };

  const build = () => {
    let q = admin
      .from("products")
      .select(SELECT, { count: "exact" })
      .eq("status", "published");
    const search = likeSafe(filters.search ?? "");
    if (search) q = q.ilike("title", `%${search}%`);
    if (filters.supplierId) q = q.eq("supplier_id", filters.supplierId);
    if (filters.category) q = q.eq("category", filters.category);
    return q.order("created_at", { ascending: false });
  };

  const { data, count } = range
    ? await build().range(range.from, range.to)
    : await build().limit(60);

  return {
    products: await withSupplierNames(admin, data ?? []),
    total: count ?? 0,
  };
}

export type CatalogFacets = {
  suppliers: { id: string; name: string }[];
  categories: string[];
};

/**
 * The supplier and category options to offer in the filter bar — derived from
 * what's actually published, so the dropdowns never list an empty combination.
 */
export async function getCatalogFacets(): Promise<CatalogFacets> {
  const admin = createAdminClient();
  if (!admin) return { suppliers: [], categories: [] };

  const { data } = await admin
    .from("products")
    .select("supplier_id, category")
    .eq("status", "published");
  const rows = data ?? [];

  const categories = [
    ...new Set(
      rows
        .map((r) => r.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const supplierIds = [...new Set(rows.map((r) => r.supplier_id))];
  const names = new Map<string, string>();
  if (supplierIds.length) {
    const { data: sup } = await admin
      .from("suppliers")
      .select("id, business_name")
      .in("id", supplierIds);
    (sup ?? []).forEach((s) => names.set(s.id, s.business_name ?? "Supplier"));
  }
  const suppliers = supplierIds
    .map((id) => ({ id, name: names.get(id) ?? "Supplier" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { suppliers, categories };
}

/** Auto-pick published products that fit a niche (falls back to any published). */
export async function autoSelectProducts(niche: string, limit = 8): Promise<CatalogProduct[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const term = niche
    .toLowerCase()
    .split(/\s+/)
    .find((w) => w.length > 2);

  let rows: RawProduct[] = [];
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
