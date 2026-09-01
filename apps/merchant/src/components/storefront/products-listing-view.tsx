"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  basePath,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categories: CategorySummary[];
  initialProducts: ApiProduct[];
  initialTotal: number;
  initialCategory: string;
  initialQuery: string;
  /** `/store/<uuid>` on the id-path route, `""` on a connected domain. */
  basePath: string;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";
  const router = useRouter();

  const { products, total, loading, category, search, setCategory, loadMore, hasMore } = useStorefrontProducts(
    store.id,
    initialProducts,
    initialTotal,
    initialCategory,
  );
  const [queryInput, setQueryInput] = useState(initialQuery);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the URL in sync (shallow — the hook already holds the real state)
  // so a filtered view is shareable and survives a reload.
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (queryInput) params.set("q", queryInput);
    const qs = params.toString();
    router.replace(`${basePath}/products${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, queryInput]);

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
            {category ? categoryLabel(category) : "Shop all"}
          </h1>

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
              <button
                onClick={() => setCategory("")}
                className="h-9 px-4 text-xs font-semibold uppercase transition"
                style={{
                  borderRadius: "var(--radius)",
                  letterSpacing: "0.06em",
                  border: `1px solid ${line}`,
                  background: category === "" ? "var(--brand)" : "transparent",
                  color: category === "" ? "#fff" : "var(--ink)",
                }}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => setCategory(c.category)}
                  className="h-9 px-4 text-xs font-semibold uppercase transition"
                  style={{
                    borderRadius: "var(--radius)",
                    letterSpacing: "0.06em",
                    border: `1px solid ${line}`,
                    background: category === c.category ? "var(--brand)" : "transparent",
                    color: category === c.category ? "#fff" : "var(--ink)",
                  }}
                >
                  {categoryLabel(c.category)} ({c.count})
                </button>
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
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 border px-8 text-xs font-semibold uppercase transition hover:opacity-70 disabled:opacity-50"
                style={{ borderRadius: "var(--radius)", borderColor: line, letterSpacing: "0.08em" }}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Load more
              </button>
            </div>
          )}
        </section>
      </StorefrontChrome>
    </div>
  );
}
