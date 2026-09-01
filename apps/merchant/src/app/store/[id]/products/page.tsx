import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { getStorefrontNav, listStoreCategories, listStoreProducts } from "@/lib/storefront-api";
import { ProductsListingView } from "@/components/storefront/products-listing-view";

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
  const store = await getStorefront(id);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories, initial] = await Promise.all([
    getStorefrontNav(id, { about: hasAbout }),
    listStoreCategories(id),
    listStoreProducts(id, { category: category || undefined, q, page: 1 }),
  ]);

  return (
    <ProductsListingView
      store={store}
      navLinks={navLinks}
      categories={categories}
      initialProducts={initial.products}
      initialTotal={initial.total}
      initialCategory={category}
      initialQuery={q}
    />
  );
}
