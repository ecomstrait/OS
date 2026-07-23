import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
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
  return <StorefrontView store={store} />;
}
