"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import type { Storefront } from "@/lib/storefront";
import type { ApiProduct, CategorySummary } from "@/lib/storefront-api";
import { categoryLabel } from "@/lib/storefront-shared";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";
import { ProductGrid } from "@/components/storefront/storefront-view";
import { useStorefrontProducts } from "@/components/storefront/use-storefront";
import type { StorefrontNavLink } from "@/lib/storefront-api";

/**
 * The store's search + category filter surface — everything the landing
 * page deliberately doesn't have lives here instead.
 */
export function ProductsListingView({
  store,
  navLinks,
  categories,
  initialProducts,
  initialTotal,
  initialCategory,
  initialQuery,
  initialPage,
  basePath,
  categoryDescription,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categories: CategorySummary[];
  initialProducts: ApiProduct[];
  initialTotal: number;
  initialCategory: string;
  initialQuery: string;
  /** From `?page=` — which real, crawlable page this render started from
   *  (1 unless reached via a "Load more" link directly, e.g. a crawler). */
  initialPage: number;
  /** `/store/<uuid>` on the id-path route, `""` on a connected domain. */
  basePath: string;
  /**
   * AI-written blurb for `initialCategory`, server-fetched for this page
   * load only — switching categories via the pills below is a real
   * navigation (a fresh page render), so this always matches whatever
   * category is actually showing; no client-side staleness to guard against
   * the way there used to be.
   */
  categoryDescription: string | null;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";
  const router = useRouter();

  const { products, total, loading, search, loadMore, hasMore } = useStorefrontProducts(
    store.id,
    initialProducts,
    initialTotal,
    initialCategory,
    initialPage,
  );
  const [queryInput, setQueryInput] = useState(initialQuery);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the URL in sync (shallow — the hook already holds the real state)
  // so a search is shareable and survives a reload. Category no longer
  // lives here (switching it is real navigation via the `<Link>` pills
  // below), so this only ever writes `q` back — `initialCategory` is what
  // it stays alongside.
  useEffect(() => {
    const params = new URLSearchParams();
    if (initialCategory) params.set("category", initialCategory);
    if (queryInput) params.set("q", queryInput);
    const qs = params.toString();
    router.replace(`${basePath}/products${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  const categoryHref = (cat: string) =>
    `${basePath}/products${cat ? `?category=${encodeURIComponent(cat)}` : ""}`;
  const nextPageHref = `${basePath}/products?${new URLSearchParams({
    ...(initialCategory ? { category: initialCategory } : {}),
    page: String(initialPage + 1),
  })}`;

  function onLoadMoreClick(e: React.MouseEvent) {
    // Progressive enhancement: this is a real `<Link>` to a real, crawlable
    // `?page=N+1` URL (so a crawler or a no-JS visitor still reaches every
    // page), but a JS-capable click intercepts it and appends in place
    // instead — the smooth "Load more" behavior this always had.
    e.preventDefault();
    loadMore();
  }

  const onQueryChange = (value: string) => {
    setQueryInput(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(value), 300);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...tokenStyle(t),
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
      }}
    >
      <StorefrontChrome store={store} navLinks={navLinks} basePath={basePath}>
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <h1
            className="text-2xl font-semibold sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
          >
            {initialCategory ? categoryLabel(initialCategory) : "Shop all"}
          </h1>
          {categoryDescription && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">{categoryDescription}</p>
          )}

          <div className="mt-8 flex flex-col gap-6 border-b pb-8" style={{ borderColor: line }}>
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full border bg-transparent pl-10 pr-4 text-sm outline-none"
                style={{ borderColor: line, borderRadius: "var(--radius)" }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Real links, not buttons — a category is a real, permanent
                  destination worth a crawler finding on its own, not just
                  client state. Next still makes this a fast, no-full-reload
                  navigation; it's just no longer JS-only. */}
              <Link
                href={categoryHref("")}
                className="inline-flex h-9 items-center px-4 text-xs font-semibold uppercase transition"
                style={{
                  borderRadius: "var(--radius)",
                  letterSpacing: "0.06em",
                  border: `1px solid ${line}`,
                  background: initialCategory === "" ? "var(--brand)" : "transparent",
                  color: initialCategory === "" ? "#fff" : "var(--ink)",
                }}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.category}
                  href={categoryHref(c.category)}
                  className="inline-flex h-9 items-center px-4 text-xs font-semibold uppercase transition"
                  style={{
                    borderRadius: "var(--radius)",
                    letterSpacing: "0.06em",
                    border: `1px solid ${line}`,
                    background: initialCategory === c.category ? "var(--brand)" : "transparent",
                    color: initialCategory === c.category ? "#fff" : "var(--ink)",
                  }}
                >
                  {categoryLabel(c.category)} ({c.count})
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs uppercase opacity-50" style={{ letterSpacing: "0.08em" }}>
            {total} {total === 1 ? "product" : "products"}
          </p>

          <div className="mt-6">
            <ProductGrid products={products} basePath={basePath} surface={surface} />
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              {/* A real link to a real `?page=N+1` URL, not a bare button —
                  a crawler (or a no-JS visitor) can follow it straight to
                  that page's own server-rendered products. A JS click
                  intercepts it and appends in place instead, same smooth
                  "Load more" this always was. */}
              <Link
                href={nextPageHref}
                onClick={onLoadMoreClick}
                aria-disabled={loading}
                className="inline-flex h-11 items-center gap-2 border px-8 text-xs font-semibold uppercase transition hover:opacity-70 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                style={{ borderRadius: "var(--radius)", borderColor: line, letterSpacing: "0.08em" }}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Load more
              </Link>
            </div>
          )}
        </section>
      </StorefrontChrome>
    </div>
  );
}
