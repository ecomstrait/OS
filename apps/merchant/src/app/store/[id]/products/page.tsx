import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";
import { categoryLabel } from "@/lib/storefront-shared";
import { requestOrigin, storefrontMetadata, truncateForMeta } from "@/lib/storefront-seo";
import { getCachedCategoryDescription } from "@/lib/category-content";

/** `?page=` is only ever meaningful as a positive integer — anything else (missing, `0`, garbage) means page 1. */
function parsePage(raw: string | undefined): number {
  return Math.max(1, Number.parseInt(raw ?? "", 10) || 1);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { category = "", q = "", page: rawPage } = await searchParams;
  const s = await getStorefront(id);
  if (!s) return { title: "Shop" };

  const origin = await requestOrigin();
  const label = category ? categoryLabel(category) : "Shop all";
  const page = parsePage(rawPage);
  const canonicalPath = `/store/${id}/products${
    category || page > 1
      ? `?${new URLSearchParams({ ...(category ? { category } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`
      : ""
  }`;
  // The AI-written category blurb, once one exists, is real page content —
  // a better meta description than the generic template below it.
  const generated = category ? await getCachedCategoryDescription(id, category) : null;
  const meta = storefrontMetadata({
    title: `${label} · ${s.name}`,
    description: generated
      ? truncateForMeta(generated)
      : category
        ? `Shop ${label} at ${s.name}.`
        : `Browse everything at ${s.name}.`,
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
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { id } = await params;
  const { category = "", q = "", page: rawPage } = await searchParams;
  return <StorefrontProducts storeId={id} category={category} q={q} page={parsePage(rawPage)} />;
}
