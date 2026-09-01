import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";
import { categoryLabel } from "@/lib/storefront-shared";
import { requestOrigin, storefrontMetadata, truncateForMeta } from "@/lib/storefront-seo";
import { getCachedCategoryDescription } from "@/lib/category-content";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const { category = "", q = "" } = await searchParams;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const s = storeId ? await getStorefront(storeId) : null;
  if (!s) return { title: "Shop" };

  const origin = await requestOrigin();
  const label = category ? categoryLabel(category) : "Shop all";
  const canonicalPath = category ? `/products?category=${encodeURIComponent(category)}` : "/products";
  const generated = category && storeId ? await getCachedCategoryDescription(storeId, category) : null;
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
  if (q) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function ProductsByDomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { domain } = await params;
  const { category = "", q = "" } = await searchParams;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontProducts storeId={storeId} category={category} q={q} basePath="" />;
}
