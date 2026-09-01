import type { Metadata } from "next";
import { getStorefront } from "@/lib/storefront";
import { getPublishedPost } from "@/lib/blog-api";
import { StorefrontBlogPost } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const [store, post] = await Promise.all([getStorefront(id), getPublishedPost(id, slug)]);
  if (!store || !post) return { title: "Post" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: post.seoTitle || `${post.title} · ${store.name}`,
    description: post.seoDescription || post.excerpt || store.plan.seoDescription || `${post.title} — ${store.name}`,
    canonical: `${origin}/store/${id}/blog/${slug}`,
    storeName: store.name,
    image: post.coverImage ?? store.logoUrl,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  return <StorefrontBlogPost storeId={id} slug={slug} />;
}
