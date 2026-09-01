import { after } from "next/server";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/storefront";
import { getStorefrontNav, getStoreProduct, listStoreCategories, listStoreProducts } from "@/lib/storefront-api";
import { categoryLabel } from "@/lib/storefront-shared";
import { ensureCategoryDescription, getCachedCategoryDescription } from "@/lib/category-content";
import { listPublishedPosts, getPublishedPost } from "@/lib/blog-api";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";
import { ProductsListingView } from "@/components/storefront/products-listing-view";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { BlogListView } from "@/components/storefront/blog-list-view";
import { BlogPostView } from "@/components/storefront/blog-post-view";
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
  const store = await getStorefront(storeId);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const hasBlog = await hasPublishedPosts(storeId);
  const [navLinks, categories] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, blog: hasBlog, basePath }),
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

  const origin = await requestOrigin();

  return (
    <>
      <JsonLdScript data={organizationJsonLd({ name: store.name, origin, logoUrl: store.logoUrl })} />
      <JsonLdScript data={websiteJsonLd({ name: store.name, origin })} />
      <StorefrontView store={store} navLinks={navLinks} categoryBands={categoryBands} basePath={basePath} />
    </>
  );
}

export async function StorefrontProducts({
  storeId,
  category = "",
  q = "",
  basePath = `/store/${storeId}`,
}: {
  storeId: string;
  category?: string;
  q?: string;
  basePath?: string;
}) {
  const store = await getStorefront(storeId);
  if (!store) notFound();

  const hasAbout = Boolean(store.plan.about || store.plan.aboutMedia);
  const hasBlog = await hasPublishedPosts(storeId);
  const [navLinks, categories, initial] = await Promise.all([
    getStorefrontNav(storeId, { about: hasAbout, blog: hasBlog, basePath }),
    listStoreCategories(storeId),
    listStoreProducts(storeId, { category: category || undefined, q, page: 1 }),
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
        store={store}
        navLinks={navLinks}
        categories={categories}
        initialProducts={initial.products}
        initialTotal={initial.total}
        initialCategory={category}
        initialQuery={q}
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
  const [store, product] = await Promise.all([getStorefront(storeId), getStoreProduct(storeId, productId)]);
  if (!store || !product) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: await hasPublishedPosts(storeId),
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
  const store = await getStorefront(storeId);
  if (!store) notFound();

  const posts = await listPublishedPosts(storeId);
  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: posts.length > 0,
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
  const [store, post] = await Promise.all([getStorefront(storeId), getPublishedPost(storeId, slug)]);
  if (!store || !post) notFound();

  const navLinks = await getStorefrontNav(storeId, {
    about: Boolean(store.plan.about || store.plan.aboutMedia),
    blog: true, // this page's own existence proves at least one post is published
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
