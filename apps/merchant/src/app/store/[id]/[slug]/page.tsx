import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { getStorePage } from "@/lib/pages-api";
import { StorefrontCustomPage } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

/**
 * A custom page (Contact Us, FAQ, ...) created through the EcomAI chat.
 * Sits alongside the literal `products`/`blog`/`success` folders — Next.js
 * always matches those first, so this dynamic segment only ever catches
 * something that isn't one of the storefront's own built-in paths.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const [store, page] = await Promise.all([getStorefront(id), getStorePage(id, slug)]);
  if (!store || !page) return { title: "Page" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: `${page.title} · ${store.name}`,
    description: page.body.slice(0, 160) || `${page.title} — ${store.name}`,
    canonical: `${origin}/store/${id}/${slug}`,
    storeName: store.name,
    image: store.logoUrl,
  });
}

export default async function CustomPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  return <StorefrontCustomPage storeId={id} slug={slug} />;
}
