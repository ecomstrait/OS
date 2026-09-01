import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { StorefrontHome } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

/**
 * Reached only via proxy.ts's rewrite — a request whose Host header is a
 * merchant's own connected domain lands here invisibly (the browser still
 * shows the merchant's domain, never this path). Everything below this
 * resolves the domain to a store id and renders exactly what `/store/[id]`
 * would; see storefront-pages.tsx for why the two share one implementation.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const s = storeId ? await getStorefront(storeId) : null;
  if (!s) return { title: "Store" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: s.plan.seoTitle || s.name,
    description: s.plan.seoDescription || `Shop ${s.name}.`,
    canonical: `${origin}/`,
    storeName: s.name,
    image: s.logoUrl,
  });
}

export default async function StoreByDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontHome storeId={storeId} basePath="" />;
}
