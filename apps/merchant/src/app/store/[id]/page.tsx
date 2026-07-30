import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { listStoreProducts } from "@/lib/storefront-api";
import { StorefrontView } from "@/components/storefront/storefront-view";

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

  // First page is server-rendered so the store is crawlable and paints without
  // JS; search and further pages come from the products API.
  const { products, total } = await listStoreProducts(id, { page: 1 });

  return <StorefrontView store={store} initialProducts={products} initialTotal={total} />;
}
