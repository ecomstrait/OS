import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { getStorefrontNav, listStoreCategories, listStoreProducts } from "@/lib/storefront-api";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";

const PREVIEW_PER_CATEGORY = 6;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getStorefront(id);
  if (!s) return { title: "Store" };
  return {
    title: s.plan.seoTitle || s.name,
    description: s.plan.seoDescription,
  };
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStorefront(id);
  if (!store) notFound();

  // The landing page is no longer a search/browse surface — it's a
  // category-by-category showcase. Every category in the catalog gets a
  // card and a preview of its own products here; the nav (capped, so it
  // stays a nav) and the dedicated products page are where someone actually
  // searches or filters.
  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories] = await Promise.all([
    getStorefrontNav(id, { about: hasAbout }),
    listStoreCategories(id),
  ]);

  const categoryBands: CategoryBand[] = await Promise.all(
    categories.map(async (c) => {
      const { products, total } = await listStoreProducts(id, {
        category: c.category,
        limit: PREVIEW_PER_CATEGORY,
      });
      return { category: c.category, products, total };
    }),
  );

  return <StorefrontView store={store} navLinks={navLinks} categoryBands={categoryBands} />;
}
