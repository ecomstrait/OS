import { cookies } from "next/headers";
import { createAdminClient } from "@ecomstrait/db";
import { productImage } from "@/lib/catalog";

/**
 * Data layer for the public storefront API.
 *
 * Every read is scoped to supplier-APPROVED listings on an own-platform store,
 * and every price is looked up server-side — the client only ever sends product
 * ids and quantities, never money.
 */

export const CART_COOKIE_DAYS = 30;
export const MAX_LINE_QTY = 99;

export type ApiProduct = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image: string | null;
  images: string[];
  price: number | null;
  /** Units a customer can actually buy right now. */
  available: number;
  inStock: boolean;
};

export type CartLine = {
  productId: string;
  title: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: number;
};

export type PricedCart = {
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
  currency: "usd";
  /** Ids dropped because they're no longer purchasable, with the reason. */
  removed: { productId: string; reason: "unavailable" | "out_of_stock" }[];
  /** Ids whose quantity was reduced to the stock on hand. */
  adjusted: { productId: string; to: number }[];
};

export type StoreSummary = {
  id: string;
  name: string;
  logoUrl: string | null;
  theme: string | null;
  currency: "usd";
};

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

function admin(): Admin | null {
  return createAdminClient();
}

/** The store, if it exists and is a custom-website store. */
export async function resolveStore(storeId: string): Promise<StoreSummary | null> {
  const db = admin();
  if (!db) return null;
  const { data } = await db
    .from("stores")
    .select("id, name, logo_url, theme, type, status")
    .eq("id", storeId)
    .maybeSingle();
  if (!data || data.type !== "own_platform") return null;
  return {
    id: data.id,
    name: data.name ?? "Store",
    logoUrl: data.logo_url,
    theme: data.theme,
    currency: "usd",
  };
}

type ListingRow = { product_id: string; price: number | null };

/** Approved listings for a store, keyed by product id. */
async function approvedListings(db: Admin, storeId: string, productIds?: string[]) {
  let query = db
    .from("store_products")
    .select("product_id, price")
    .eq("store_id", storeId)
    .eq("status", "approved");
  if (productIds?.length) query = query.in("product_id", productIds);
  const { data } = await query;
  return new Map((data ?? []).map((r: ListingRow) => [r.product_id, r.price]));
}

function toApiProduct(
  p: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    images: string[];
    retail_price: number | null;
    stock: number;
    reserved: number;
  },
  listedPrice: number | null,
): ApiProduct {
  const available = Math.max(0, (p.stock ?? 0) - (p.reserved ?? 0));
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    image: productImage(p.images?.[0]),
    images: (p.images ?? []).map((i) => productImage(i)).filter((u): u is string => Boolean(u)),
    price: listedPrice ?? p.retail_price,
    available,
    inStock: available > 0,
  };
}

const PRODUCT_COLUMNS = "id, title, description, category, images, retail_price, stock, reserved, status";

export type ProductQuery = { q?: string; page?: number; limit?: number };

/** Paged product listing for a storefront. */
export async function listStoreProducts(
  storeId: string,
  { q = "", page = 1, limit = 24 }: ProductQuery,
): Promise<{ products: ApiProduct[]; total: number; page: number; limit: number }> {
  const db = admin();
  if (!db) return { products: [], total: 0, page, limit };

  const listed = await approvedListings(db, storeId);
  const ids = [...listed.keys()];
  if (!ids.length) return { products: [], total: 0, page, limit };

  // Filtering happens on `products`, so the count has to come from there too —
  // the approved-id set alone can't tell us how many match the search.
  const term = q.replace(/[%_\\,()]/g, " ").trim().slice(0, 80);
  const build = () => {
    let query = db
      .from("products")
      .select(PRODUCT_COLUMNS, { count: "exact" })
      .in("id", ids)
      .eq("status", "published");
    if (term) query = query.ilike("title", `%${term}%`);
    return query.order("title");
  };

  const size = Math.min(Math.max(1, limit), 60);
  const from = (Math.max(1, page) - 1) * size;
  const { data, count } = await build().range(from, from + size - 1);

  return {
    products: (data ?? []).map((p) => toApiProduct(p, listed.get(p.id) ?? null)),
    total: count ?? 0,
    page: Math.max(1, page),
    limit: size,
  };
}

/** A single storefront product, or null if it isn't approved/published here. */
export async function getStoreProduct(
  storeId: string,
  productId: string,
): Promise<ApiProduct | null> {
  const db = admin();
  if (!db) return null;
  const listed = await approvedListings(db, storeId, [productId]);
  if (!listed.has(productId)) return null;

  const { data } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return toApiProduct(data, listed.get(productId) ?? null);
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type RawLine = { productId: string; quantity: number };

const cartCookieName = (storeId: string) => `es_cart_${storeId}`;

/** Read the raw cart (ids + quantities only) from the cookie. */
export async function readCart(storeId: string): Promise<RawLine[]> {
  const jar = await cookies();
  const raw = jar.get(cartCookieName(storeId))?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((l) => l as { p?: unknown; q?: unknown })
      .filter((l) => typeof l.p === "string" && typeof l.q === "number")
      .map((l) => ({ productId: l.p as string, quantity: Math.trunc(l.q as number) }))
      .filter((l) => l.quantity > 0)
      .slice(0, 100);
  } catch {
    return [];
  }
}

/** Persist the cart. Nothing sensitive lives here — only ids and quantities. */
export async function writeCart(storeId: string, lines: RawLine[]): Promise<void> {
  const jar = await cookies();
  const name = cartCookieName(storeId);
  if (!lines.length) {
    jar.delete(name);
    return;
  }
  jar.set(name, JSON.stringify(lines.map((l) => ({ p: l.productId, q: l.quantity }))), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_DAYS * 24 * 60 * 60,
  });
}

/**
 * Price a set of raw lines against the store's approved catalog.
 *
 * Anything no longer purchasable is dropped and reported rather than silently
 * ignored, so the storefront can tell the customer what changed.
 */
export async function priceCart(storeId: string, lines: RawLine[]): Promise<PricedCart> {
  const empty: PricedCart = {
    lines: [],
    subtotal: 0,
    itemCount: 0,
    currency: "usd",
    removed: [],
    adjusted: [],
  };
  const db = admin();
  if (!db || !lines.length) return empty;

  const ids = [...new Set(lines.map((l) => l.productId))];
  const listed = await approvedListings(db, storeId, ids);
  const { data: prods } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids)
    .eq("status", "published");
  const byId = new Map((prods ?? []).map((p) => [p.id, p]));

  const out: PricedCart = { ...empty, lines: [], removed: [], adjusted: [] };

  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || !listed.has(line.productId)) {
      out.removed.push({ productId: line.productId, reason: "unavailable" });
      continue;
    }
    const api = toApiProduct(product, listed.get(line.productId) ?? null);
    if (api.available <= 0) {
      out.removed.push({ productId: line.productId, reason: "out_of_stock" });
      continue;
    }
    const unitPrice = api.price ?? 0;
    if (unitPrice <= 0) {
      out.removed.push({ productId: line.productId, reason: "unavailable" });
      continue;
    }

    const wanted = Math.min(Math.max(1, line.quantity), MAX_LINE_QTY);
    const quantity = Math.min(wanted, api.available);
    if (quantity !== line.quantity) out.adjusted.push({ productId: line.productId, to: quantity });

    out.lines.push({
      productId: api.id,
      title: api.title,
      image: api.image,
      unitPrice,
      quantity,
      lineTotal: Math.round(unitPrice * quantity * 100) / 100,
      available: api.available,
    });
  }

  out.subtotal = Math.round(out.lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  out.itemCount = out.lines.reduce((s, l) => s + l.quantity, 0);
  return out;
}

/** Apply a mutation to the stored cart and return the re-priced result. */
export async function mutateCart(
  storeId: string,
  change: { productId: string; quantity: number; mode: "set" | "add" },
): Promise<PricedCart> {
  const current = await readCart(storeId);
  const idx = current.findIndex((l) => l.productId === change.productId);
  const next = [...current];

  const qty =
    change.mode === "add" ? (idx >= 0 ? next[idx].quantity : 0) + change.quantity : change.quantity;

  if (qty <= 0) {
    if (idx >= 0) next.splice(idx, 1);
  } else if (idx >= 0) {
    next[idx] = { ...next[idx], quantity: Math.min(qty, MAX_LINE_QTY) };
  } else {
    next.push({ productId: change.productId, quantity: Math.min(qty, MAX_LINE_QTY) });
  }

  const priced = await priceCart(storeId, next);
  // Persist what survived pricing, so a dropped line doesn't linger in the jar.
  await writeCart(
    storeId,
    priced.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
  );
  return priced;
}
