import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/storefront";
import { getStorefrontNav, getStoreProduct, listStoreCategories, listStoreProducts } from "@/lib/storefront-api";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";
import { ProductsListingView } from "@/components/storefront/products-listing-view";
import { ProductDetailView } from "@/components/storefront/product-detail-view";

/**
 * The three storefront pages' actual bodies, each taking an already-resolved
 * `storeId` — shared between `/store/[id]/*` (id in the URL) and
 * `/store/by-domain/[domain]/*` (id resolved from a merchant's custom
 * domain by the caller). Two routes into the store, one implementation:
 * a fix here can't land on one and be forgotten on the other.
 *
 * `basePath` defaults to the `/store/<uuid>` prefix every link on the
 * id-path route has always used. The by-domain caller passes `""` instead,
 * so a customer on a merchant's connected domain gets clean domain-relative
 * links (`/products`, `/products/<id>`) rather than URLs that leak the
 * internal store id onto their own brand's domain.
 */

const PREVIEW_PER_CATEGORY = 6;

export async function StorefrontHome({
  storeId,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  basePath?: string;
}) {
  const store = await getStorefront(storeId);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, basePath }),
    listStoreCategories(storeId),
  ]);

  const categoryBands: CategoryBand[] = await Promise.all(
    categories.map(async (c) => {
      const { products, total } = await listStoreProducts(storeId, {
        category: c.category,
        limit: PREVIEW_PER_CATEGORY,
      });
      return { category: c.category, products, total };
    }),
  );

  return <StorefrontView store={store} navLinks={navLinks} categoryBands={categoryBands} basePath={basePath} />;
}

export async function StorefrontProducts({
  storeId,
  category = "",
  q = "",
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  category?: string;
  q?: string;
  basePath?: string;
}) {
  const store = await getStorefront(storeId);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories, initial] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, basePath }),
    listStoreCategories(storeId),
    listStoreProducts(storeId, { category: category || undefined, q, page: 1 }),
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
      basePath={basePath}
    />
  );
}

export async function StorefrontProductDetail({
  storeId,
  productId,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  productId: string;
  basePath?: string;
}) {
  const [store, product] = await Promise.all([getStorefront(storeId), getStoreProduct(storeId, productId)]);
  if (!store || !product) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    basePath,
  });

  return <ProductDetailView store={store} product={product} navLinks={navLinks} basePath={basePath} />;
}
