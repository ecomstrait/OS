import { resolveStoreIdByDomain } from "@/lib/storefront";
import { listStoreCategories, listStoreProducts } from "@/lib/storefront-api";
import { listPublishedPosts } from "@/lib/blog-api";

export const runtime = "nodejs";

function urlTag(loc: string, changefreq: string, priority: number): string {
  return `<url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

/**
 * The sitemap a merchant's own connected domain serves at its own root —
 * reached via proxy.ts's rewrite, exactly like the storefront pages
 * themselves. Scoped to just this one store, with every URL relative to
 * this domain: a crawler visiting `yourbrand.com/sitemap.xml` must never see
 * `os-merchant.vercel.app/store/<uuid>/...` links in it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain);
  const storeId = await resolveStoreIdByDomain(domain);
  if (!storeId) return new Response("Not found", { status: 404 });

  const base = `https://${domain}`;
  const urls = [urlTag(base, "weekly", 0.8), urlTag(`${base}/products`, "daily", 0.6)];

  const categories = await listStoreCategories(storeId);
  for (const c of categories) {
    urls.push(urlTag(`${base}/products?category=${encodeURIComponent(c.category)}`, "weekly", 0.5));
  }

  // Same 60-product cap as the root sitemap — see its comment.
  const { products } = await listStoreProducts(storeId, { limit: 60 });
  for (const p of products) {
    urls.push(urlTag(`${base}/products/${p.id}`, "weekly", 0.5));
  }

  const posts = await listPublishedPosts(storeId);
  if (posts.length) {
    urls.push(urlTag(`${base}/blog`, "weekly", 0.5));
    for (const p of posts) urls.push(urlTag(`${base}/blog/${p.slug}`, "monthly", 0.4));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
