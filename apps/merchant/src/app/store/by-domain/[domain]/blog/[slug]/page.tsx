import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront, resolveStoreIdByDomain } from "@/lib/storefront";
import { getPublishedPost } from "@/lib/blog-api";
import { StorefrontBlogPost } from "@/lib/storefront-pages";
import { requestOrigin, storefrontMetadata } from "@/lib/storefront-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}): Promise<Metadata> {
  const { domain, slug } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  const [store, post] = storeId
    ? await Promise.all([getStorefront(storeId), getPublishedPost(storeId, slug)])
    : [null, null];
  if (!store || !post) return { title: "Post" };
  const origin = await requestOrigin();
  return storefrontMetadata({
    title: post.seoTitle || `${post.title} · ${store.name}`,
    description: post.seoDescription || post.excerpt || store.plan.seoDescription || `${post.title} — ${store.name}`,
    canonical: `${origin}/blog/${slug}`,
    storeName: store.name,
    image: post.coverImage ?? store.logoUrl,
  });
}

export default async function BlogPostByDomainPage({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const { domain, slug } = await params;
  const storeId = await resolveStoreIdByDomain(decodeURIComponent(domain));
  if (!storeId) notFound();
  return <StorefrontBlogPost storeId={storeId} slug={slug} basePath="" />;
}
