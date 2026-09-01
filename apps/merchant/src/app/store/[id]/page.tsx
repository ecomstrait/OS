import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontHome } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getStorefront(id);
  if (!s) return { title: "Store" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: s.plan.seoTitle || s.name,
    description: s.plan.seoDescription || `Shop ${s.name}.`,
    canonical: `${origin}/store/${id}`,
    storeName: s.name,
    image: s.logoUrl,
  });
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StorefrontHome storeId={id} />;
}
