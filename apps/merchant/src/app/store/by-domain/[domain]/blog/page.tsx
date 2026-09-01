import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { StorefrontBlogList } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const s = storeId ? await getStorefront(storeId) : null;
  if (!s) return { title: "Journal" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: `Journal · ${s.name}`,
    description: `Stories, guides and updates from ${s.name}.`,
    canonical: `${origin}/blog`,
    storeName: s.name,
    image: s.logoUrl,
  });
}

export default async function BlogByDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontBlogList storeId={storeId} basePath="" />;
}
