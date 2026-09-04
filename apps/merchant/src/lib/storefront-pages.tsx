import { after } from "next/server";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/storefront";
import {
  getStorefrontNav,
  getStoreProduct,
  getStoreProductsByIds,
  listStoreCategories,
  listStoreProducts,
  type ApiProduct,
} from "@/lib/storefront-api";
import { categoryLabel } from "@/lib/storefront-shared";
import { ensureCategoryDescription, getCachedCategoryDescription } from "@/lib/category-content";
import { listPublishedPosts, getPublishedPost } from "@/lib/blog-api";
import { listStorePages, getStorePage } from "@/lib/pages-api";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";
import { ProductsListingView } from "@/components/storefront/products-listing-view";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { BlogListView } from "@/components/storefront/blog-list-view";
import { BlogPostView } from "@/components/storefront/blog-post-view";
import { PageView } from "@/components/storefront/page-view";
import {
  JsonLdScript,
  articleJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  productJsonLd,
  requestOrigin,
  websiteJsonLd,
} from "@/lib/storefront-seo";

/** Whether the nav should offer a "Blog" link — never to a page with nothing on it. */
async function hasPublishedPosts(storeId: string): Promise<boolean> {
  return (await listPublishedPosts(storeId)).length > 0;
}

/**
 * The three storefront pages' actual bodies, each taking an already-resolved
 * `storeId` — shared between `/store/[id]/*` (id in the URL) and
 * `/store/by-domain/[domain]/*` (id resolved from a merchant's custom
 * domain by the caller). Two routes into the store, one implementation:
 * a fix here can't land on one and be forgotten on the other.
 *
 * `basePath` defaults to the `/store/<uuid>` prefix every link on the
 * id-path route has always used. The by-domain caller passes `""` instead,
 * so a customer on a merchant's connected domain gets clean domain-relative
 * links (`/products`, `/products/<id>`) rather than URLs that leak the
 * internal store id onto their own brand's domain.
 */

const PREVIEW_PER_CATEGORY = 6;

export async function StorefrontHome({
  storeId,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  basePath?: string;
}) {
  // `hasBlog`/`pages` don't depend on `store`, so they run alongside it
  // rather than after it — was three sequential round trips before this.
  const [store, hasBlog, pages] = await Promise.all([
    getStorefront(storeId),
    hasPublishedPosts(storeId),
    listStorePages(storeId),
  ]);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, blog: hasBlog, pages, basePath }),
    listStoreCategories(storeId),
  ]);

  const categoryBands: CategoryBand[] = await Promise.all(
    categories.map(async (c) => {
      const { products, total } = await listStoreProducts(storeId, {
        category: c.category,
        limit: PREVIEW_PER_CATEGORY,
      });
      return { category: c.category, products, total };
    }),
  );

  // "products" sections (e.g. "Best sellers") only store ids — resolved to
  // live product data here, the same way categoryBands already are, so the
  // homepage never ships a section a merchant curated but can't actually see.
  const productSections = (store.plan.sections ?? []).filter((s) => s.type === "products");
  const productsBySection: Record<string, ApiProduct[]> = {};
  if (productSections.length) {
    await Promise.all(
      productSections.map(async (s) => {
        productsBySection[s.id] = await getStoreProductsByIds(storeId, s.productIds ?? []);
      }),
    );
  }

  const origin = await requestOrigin();

  return (
    <>
      <JsonLdScript data={organizationJsonLd({ name: store.name, origin, logoUrl: store.logoUrl })} />
      <JsonLdScript data={websiteJsonLd({ name: store.name, origin })} />
      <StorefrontView
        store={store}
        navLinks={navLinks}
        categoryBands={categoryBands}
        productsBySection={productsBySection}
        basePath={basePath}
      />
    </>
  );
}

export async function StorefrontProducts({
  storeId,
  category = "",
  q = "",
  page = 1,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  category?: string;
  q?: string;
  /** From `?page=` — a real, independently crawlable page of results, not
   *  just the client-side "Load more" append. See ProductsListingView. */
  page?: number;
  basePath?: string;
}) {
  // `hasBlog`/`pages` don't depend on `store`, so they run alongside it
  // rather than after it — was three sequential round trips before this.
  const [store, hasBlog, pages] = await Promise.all([
    getStorefront(storeId),
    hasPublishedPosts(storeId),
    listStorePages(storeId),
  ]);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const [navLinks, categories, initial] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, blog: hasBlog, pages, basePath }),
    listStoreCategories(storeId),
    listStoreProducts(storeId, { category: category || undefined, q, page }),
  ]);

  const origin = await requestOrigin();
  const home = basePath || "/";
  const crumbs = [
    { name: store.name, url: `${origin}${home}` },
    ...(category
      ? [{ name: categoryLabel(category), url: `${origin}${basePath}/products?category=${encodeURIComponent(category)}` }]
      : [{ name: "Shop all", url: `${origin}${basePath}/products` }]),
  ];

  // Real, unique copy for a category page instead of a bare grid — cached
  // after the first generation, and never blocking this page on an AI call:
  // a category with nothing cached yet just renders without a description,
  // and `after()` queues the generation for whoever visits next.
  let categoryDescription: string | null = null;
  if (category) {
    categoryDescription = await getCachedCategoryDescription(storeId, category);
    if (!categoryDescription) {
      const productTitles = initial.products.map((p) => p.title);
      after(() => ensureCategoryDescription({ storeId, storeName: store.name, category, productTitles }));
    }
  }

  // Skipped for a search view (`q` set) — same reasoning as its noindex in
  // generateMetadata: a query's results are ephemeral and thin, not a
  // canonical list worth describing to a crawler.
  const itemList = q
    ? null
    : itemListJsonLd(initial.products.map((p) => ({ name: p.title, url: `${origin}${basePath}/products/${p.id}` })));

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      {itemList && <JsonLdScript data={itemList} />}
      <ProductsListingView
        // Remounts the whole client subtree on a real navigation to a
        // different category or page — see use-storefront.ts's doc comment
        // on why this replaces an effect that would otherwise have to
        // re-sync local state to fresh props by hand.
        key={`${category}:${page}`}
        store={store}
        navLinks={navLinks}
        categories={categories}
        initialProducts={initial.products}
        initialTotal={initial.total}
        initialCategory={category}
        initialQuery={q}
        initialPage={page}
        basePath={basePath}
        categoryDescription={categoryDescription}
      />
    </>
  );
}

export async function StorefrontProductDetail({
  storeId,
  productId,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  productId: string;
  basePath?: string;
}) {
  // None of these four actually depend on each other's result (`hasBlog`/
  // `pages` only need `storeId`, not `store` itself) — one round trip
  // instead of the two-or-three sequential stages this used to be.
  const [store, product, hasBlog, pages] = await Promise.all([
    getStorefront(storeId),
    getStoreProduct(storeId, productId),
    hasPublishedPosts(storeId),
    listStorePages(storeId),
  ]);
  if (!store || !product) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: hasBlog,
    pages,
    basePath,
  });

  const origin = await requestOrigin();
  const home = basePath || "/";
  const productUrl = `${origin}${basePath}/products/${productId}`;
  const crumbs = [
    { name: store.name, url: `${origin}${home}` },
    ...(product.category
      ? [{ name: categoryLabel(product.category), url: `${origin}${basePath}/products?category=${encodeURIComponent(product.category)}` }]
      : []),
    { name: product.title, url: productUrl },
  ];

  return (
    <>
      <JsonLdScript data={productJsonLd({ product, url: productUrl })} />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      <ProductDetailView store={store} product={product} navLinks={navLinks} basePath={basePath} />
    </>
  );
}

export async function StorefrontBlogList({
  storeId,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  basePath?: string;
}) {
  const [store, posts, pages] = await Promise.all([
    getStorefront(storeId),
    listPublishedPosts(storeId),
    listStorePages(storeId),
  ]);
  if (!store) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: posts.length > 0,
    pages,
    basePath,
  });

  return <BlogListView store={store} navLinks={navLinks} posts={posts} basePath={basePath} />;
}

export async function StorefrontBlogPost({
  storeId,
  slug,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  slug: string;
  basePath?: string;
}) {
  const [store, post, pages] = await Promise.all([
    getStorefront(storeId),
    getPublishedPost(storeId, slug),
    listStorePages(storeId),
  ]);
  if (!store || !post) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: true, // this page's own existence proves at least one post is published
    pages,
    basePath,
  });

  const origin = await requestOrigin();
  const home = basePath || "/";
  const postUrl = `${origin}${basePath}/blog/${slug}`;
  const crumbs = [
    { name: store.name, url: `${origin}${home}` },
    { name: "Blog", url: `${origin}${basePath}/blog` },
    { name: post.title, url: postUrl },
  ];

  return (
    <>
      <JsonLdScript
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt,
          url: postUrl,
          image: post.coverImage,
          publishedAt: post.publishedAt,
          authorName: store.name,
        })}
      />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      <BlogPostView store={store} navLinks={navLinks} post={post} basePath={basePath} />
    </>
  );
}

/**
 * A custom page — Contact Us, FAQ, Shipping, whatever a merchant asked the
 * EcomAI chat to create (see `applyPageAction` in builder-actions.ts). Same
 * `[slug]` segment on both routes; `[slug]` sits alongside the literal
 * `products`/`blog`/`success` folders, which Next always matches first.
 */
export async function StorefrontCustomPage({
  storeId,
  slug,
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  slug: string;
  basePath?: string;
}) {
  const [store, page, hasBlog, pages] = await Promise.all([
    getStorefront(storeId),
    getStorePage(storeId, slug),
    hasPublishedPosts(storeId),
    listStorePages(storeId),
  ]);
  if (!store || !page) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: hasBlog,
    pages,
    basePath,
  });

  const origin = await requestOrigin();
  const home = basePath || "/";
  const crumbs = [
    { name: store.name, url: `${origin}${home}` },
    { name: page.title, url: `${origin}${basePath}/${slug}` },
  ];

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      <PageView store={store} navLinks={navLinks} page={page} basePath={basePath} />
    </>
  );
}
