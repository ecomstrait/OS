import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { StorefrontProducts } from "@/lib/storefront-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const s = storeId ? await getStorefront(storeId) : null;
  if (!s) return { title: "Shop" };
  return { title: `Shop · ${s.name}` };
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
