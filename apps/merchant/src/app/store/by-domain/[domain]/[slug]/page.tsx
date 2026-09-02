import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { getStorePage } from "@/lib/pages-api";
import { StorefrontCustomPage } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}): Promise<Metadata> {
  const { domain, slug } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const [store, page] = storeId
    ? await Promise.all([getStorefront(storeId), getStorePage(storeId, slug)])
    : [null, null];
  if (!store || !page) return { title: "Page" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: `${page.title} · ${store.name}`,
    description: page.body.slice(0, 160) || `${page.title} — ${store.name}`,
    canonical: `${origin}/${slug}`,
    storeName: store.name,
    image: store.logoUrl,
  });
}

export default async function CustomPageByDomain({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const { domain, slug } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontCustomPage storeId={storeId} slug={slug} basePath="" />;
}
