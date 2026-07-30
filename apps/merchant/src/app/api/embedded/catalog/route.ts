import { NextResponse } from "next/server";
import { authenticateEmbedded } from "@/lib/embedded-auth";

export const runtime = "nodejs";

const PAGE_SIZE = 24;

/**
 * GET /api/embedded/catalog?shop=&q=&category=&supplier=&page=
 *
 * The supplier catalog as the embedded Shopify app sees it: published products
 * across approved suppliers, annotated with whether this shop has already
 * listed each one. Facets come back with the first page so the filter row can
 * render without a second round trip.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = await authenticateEmbedded(req, url.searchParams.get("shop"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin, storeId } = auth.ctx;

  const q = (url.searchParams.get("q") ?? "").replace(/[%_\\,()]/g, " ").trim().slice(0, 80);
  const category = url.searchParams.get("category") ?? "";
  const supplier = url.searchParams.get("supplier") ?? "";
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const from = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("products")
    .select("id, title, category, images, retail_price, wholesale_price, supplier_id, stock, reserved", {
      count: "exact",
    })
    .eq("status", "published");
  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (supplier) query = query.eq("supplier_id", supplier);

  const { data: rows, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const products = rows ?? [];

  // Supplier names for the cards.
  const supplierIds = [...new Set(products.map((p) => p.supplier_id))];
  const names = new Map<string, string>();
  if (supplierIds.length) {
    const { data: sups } = await admin
      .from("suppliers")
      .select("id, business_name")
      .in("id", supplierIds);
    (sups ?? []).forEach((s) => names.set(s.id, s.business_name ?? "Supplier"));
  }

  // What this shop has already listed, so the card shows Added / Pending.
  const listed = new Map<string, string>();
  if (storeId && products.length) {
    const { data: sp } = await admin
      .from("store_products")
      .select("product_id, status")
      .eq("store_id", storeId)
      .in(
        "product_id",
        products.map((p) => p.id),
      );
    (sp ?? []).forEach((r) => listed.set(r.product_id, r.status));
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const imageUrl = (path?: string | null) =>
    path && base ? `${base}/storage/v1/object/public/product-images/${path}` : null;

  // Facets are only needed for the filter row, which the client renders once.
  let facets: { categories: string[]; suppliers: { id: string; name: string }[] } | undefined;
  if (page === 1) {
    const { data: all } = await admin
      .from("products")
      .select("category, supplier_id")
      .eq("status", "published");
    const cats = [
      ...new Set((all ?? []).map((r) => r.category?.trim()).filter((c): c is string => Boolean(c))),
    ].sort((a, b) => a.localeCompare(b));
    const facetSupplierIds = [...new Set((all ?? []).map((r) => r.supplier_id))];
    const facetNames = new Map<string, string>();
    if (facetSupplierIds.length) {
      const { data: sups } = await admin
        .from("suppliers")
        .select("id, business_name")
        .in("id", facetSupplierIds);
      (sups ?? []).forEach((s) => facetNames.set(s.id, s.business_name ?? "Supplier"));
    }
    facets = {
      categories: cats,
      suppliers: facetSupplierIds
        .map((id) => ({ id, name: facetNames.get(id) ?? "Supplier" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  return NextResponse.json(
    {
      linked: Boolean(storeId),
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      facets,
      products: products.map((p) => {
        const available = Math.max(0, (p.stock ?? 0) - (p.reserved ?? 0));
        const retail = p.retail_price;
        const cost = p.wholesale_price;
        return {
          id: p.id,
          title: p.title,
          category: p.category,
          image: imageUrl(p.images?.[0]),
          price: retail,
          // Collective shows a margin per product; ours is retail vs wholesale.
          margin:
            retail != null && cost != null && retail > 0
              ? Math.round(((retail - cost) / retail) * 100)
              : null,
          supplierName: names.get(p.supplier_id) ?? "Supplier",
          supplierId: p.supplier_id,
          available,
          listingStatus: listed.get(p.id) ?? null,
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
