import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { StorefrontBlogList } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getStorefront(id);
  if (!s) return { title: "Journal" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: `Journal · ${s.name}`,
    description: `Stories, guides and updates from ${s.name}.`,
    canonical: `${origin}/store/${id}/blog`,
    storeName: s.name,
    image: s.logoUrl,
  });
}

export default async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StorefrontBlogList storeId={id} />;
}
