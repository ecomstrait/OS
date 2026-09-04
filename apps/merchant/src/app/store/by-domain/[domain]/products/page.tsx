import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";
import { categoryLabel } from "@/lib/storefront-shared";
import { requestOrigin, storefrontMetadata, truncateForMeta } from "@/lib/storefront-seo";
import { getCachedCategoryDescription } from "@/lib/category-content";

/** `?page=` is only ever meaningful as a positive integer — anything else (missing, `0`, garbage) means page 1. */
function parsePage(raw: string | undefined): number {
  return Math.max(1, Number.parseInt(raw ?? "", 10) || 1);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const { category = "", q = "", page: rawPage } = await searchParams;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const s = storeId ? await getStorefront(storeId) : null;
  if (!s) return { title: "Shop" };

  const origin = await requestOrigin();
  const label = category ? categoryLabel(category) : "Shop all";
  const page = parsePage(rawPage);
  const canonicalPath = `/products${
    category || page > 1
      ? `?${new URLSearchParams({ ...(category ? { category } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`
      : ""
  }`;
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
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { domain } = await params;
  const { category = "", q = "", page: rawPage } = await searchParams;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontProducts storeId={storeId} category={category} q={q} page={parsePage(rawPage)} basePath="" />;
}
