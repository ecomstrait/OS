import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontHome } from "@/lib/storefront-pages";

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
  return <StorefrontHome storeId={id} />;
}
