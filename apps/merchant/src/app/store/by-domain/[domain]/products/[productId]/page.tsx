import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { getStoreProduct } from "@/lib/storefront-api";
import { StorefrontProductDetail } from "@/lib/storefront-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; productId: string }>;
}): Promise<Metadata> {
  const { domain, productId } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const [store, product] = storeId
    ? await Promise.all([getStorefront(storeId), getStoreProduct(storeId, productId)])
    : [null, null];
  if (!store || !product) return { title: "Product" };
  return {
    title: `${product.title} · ${store.name}`,
    description: product.description ?? store.plan.seoDescription,
  };
}

export default async function ProductByDomainPage({
  params,
}: {
  params: Promise<{ domain: string; productId: string }>;
}) {
  const { domain, productId } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontProductDetail storeId={storeId} productId={productId} basePath="" />;
}
