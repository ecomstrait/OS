import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getStorefront(id);
  if (!s) return { title: "Shop" };
  return { title: `Shop · ${s.name}` };
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
