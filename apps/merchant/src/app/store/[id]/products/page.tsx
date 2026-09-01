import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";
import { categoryLabel } from "@/lib/storefront-shared";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { category = "", q = "" } = await searchParams;
  const s = await getStorefront(id);
  if (!s) return { title: "Shop" };

  const origin = await requestOrigin();
  const label = category ? categoryLabel(category) : "Shop all";
  const canonicalPath = category ? `/store/${id}/products?category=${encodeURIComponent(category)}` : `/store/${id}/products`;
  const meta = storefrontMetadata({
    title: `${label} · ${s.name}`,
    description: category ? `Shop ${label} at ${s.name}.` : `Browse everything at ${s.name}.`,
    canonical: `${origin}${canonicalPath}`,
    storeName: s.name,
    image: s.logoUrl,
  });
  // A keyword search view is thin, duplicate-prone content — real for the
  // visitor, not something worth a search engine indexing on its own.
  if (q) meta.robots = { index: false, follow: true };
  return meta;
}

/**
 * The store's one search-and-filter surface. The landing page sells
 * categories; this page is where a customer actually looks for something —
 * every category card and every nav link ends up here.
 */
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { id } = await params;
  const { category = "", q = "" } = await searchParams;
  return <StorefrontProducts storeId={id} category={category} q={q} />;
}
