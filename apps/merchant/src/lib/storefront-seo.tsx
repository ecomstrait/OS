import "server-only";

import { headers } from "next/headers";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import type { ApiProduct } from "@/lib/storefront-api";

/**
 * SEO for the public storefront — metadata and structured data, shared by
 * every `/store/[id]/*` and `/store/by-domain/[domain]/*` page so the two
 * routes into the same store can't drift.
 */

/**
 * The origin actually serving this request — a merchant's own connected
 * domain when reached that way, the shared merchant host otherwise. Every
 * canonical/OG URL has to reflect wherever a crawler actually found the
 * page, not always the shared host: a customer's browser (and Google) sees
 * `yourbrand.com`, not `os-merchant.vercel.app/store/<uuid>`.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Metadata every public storefront page needs, folded into one place.
 *
 * `robots: { index: true }` is not optional here — the merchant app's root
 * layout sets `index: false` for the dashboard, and Next.js merges metadata
 * down the tree; a storefront page that left `robots` unset would silently
 * inherit "don't index me" from the dashboard layout above it. That bug
 * would have made every merchant's storefront invisible to search engines
 * regardless of how good its content was.
 */
export function storefrontMetadata({
  title,
  description,
  canonical,
  storeName,
  image,
}: {
  title: string;
  description: string;
  /** Absolute URL — build with `requestOrigin()` + the page's own path. */
  canonical: string;
  storeName: string;
  /** Absolute image URL for OG/Twitter — a product photo, or the store's logo. */
  image?: string | null;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: storeName,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Trims AI-written copy to something a meta description tag can hold, without cutting mid-word. */
export function truncateForMeta(text: string, max = 160): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

type JsonLd = Record<string, unknown>;

/** Renders a JSON-LD block. Data only ever comes from the store's own catalog/plan — never user input echoed unescaped elsewhere. */
export function JsonLdScript({ data }: { data: JsonLd }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function organizationJsonLd({
  name,
  origin,
  logoUrl,
}: {
  name: string;
  origin: string;
  logoUrl?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: origin,
    ...(logoUrl ? { logo: logoUrl } : {}),
  };
}

export function websiteJsonLd({ name, origin }: { name: string; origin: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: origin,
  };
}

/** The current page's products, in the order shown — not a whole category, just what's actually on this page. */
export function itemListJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Real data only: availability/price come straight from the priced catalog, never guessed. */
export function productJsonLd({
  product,
  url,
  currency = "USD",
}: {
  product: ApiProduct;
  url: string;
  currency?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images.length ? { image: product.images } : {}),
    ...(product.category ? { category: product.category } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      ...(product.price != null ? { price: product.price } : {}),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export function articleJsonLd({
  title,
  description,
  url,
  image,
  publishedAt,
  authorName,
}: {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  publishedAt: string;
  authorName: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    datePublished: publishedAt,
    author: { "@type": "Organization", name: authorName },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
