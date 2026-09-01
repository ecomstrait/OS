import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { getStorefrontNav, getStoreProduct } from "@/lib/storefront-api";
import { ProductDetailView } from "@/components/storefront/product-detail-view";

/**
 * The product detail page — the single biggest structural gap this
 * storefront had against real premium references (julke.pk,
 * gomilaintersole.pk both route every product card to a full detail page;
 * ours only ever added straight to cart from the grid, with no page to link
 * to). The data layer (`getStoreProduct`, full `images[]`, `description`)
 * already existed; nothing rendered it.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}): Promise<Metadata> {
  const { id, productId } = await params;
  const [store, product] = await Promise.all([getStorefront(id), getStoreProduct(id, productId)]);
  if (!store || !product) return { title: "Product" };
  return {
    title: `${product.title} · ${store.name}`,
    description: product.description ?? store.plan.seoDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;
  const [store, product] = await Promise.all([getStorefront(id), getStoreProduct(id, productId)]);
  if (!store || !product) notFound();

  const navLinks = await getStorefrontNav(id, { about: Boolean(store.plan.about || store.plan.aboutMedia) });

  return <ProductDetailView store={store} product={product} navLinks={navLinks} />;
}
