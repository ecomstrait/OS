"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiProduct, PricedCart } from "@/lib/storefront-api";

const EMPTY: PricedCart = {
  lines: [],
  subtotal: 0,
  itemCount: 0,
  currency: "usd",
  removed: [],
  adjusted: [],
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || "Something went wrong");
  return body;
}

/**
 * Binds the storefront to its own HTTP API rather than local state.
 *
 * The cart lives server-side (a cookie of ids + quantities, re-priced on every
 * response), so prices, stock limits and availability are always the server's
 * answer — a stale tab can't check out at yesterday's price.
 */
export function useStorefrontCart(storeId: string) {
  const base = `/api/storefront/${storeId}`;
  const [cart, setCart] = useState<PricedCart>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const run = useCallback(async (fn: () => Promise<{ cart: PricedCart }>) => {
    setBusy(true);
    setError(null);
    try {
      const { cart: next } = await fn();
      setCart(next);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  // Hydrate from the server cart so a reload (or a return from Stripe) shows
  // the real basket rather than an empty one.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void run(() => call<{ cart: PricedCart }>(`${base}/cart`));
  }, [base, run]);

  const add = useCallback(
    (productId: string, quantity = 1) =>
      run(() =>
        call<{ cart: PricedCart }>(`${base}/cart`, {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        }),
      ),
    [base, run],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      run(() =>
        call<{ cart: PricedCart }>(`${base}/cart`, {
          method: "PATCH",
          body: JSON.stringify({ productId, quantity }),
        }),
      ),
    [base, run],
  );

  const remove = useCallback(
    (productId: string) =>
      run(() =>
        call<{ cart: PricedCart }>(`${base}/cart?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        }),
      ),
    [base, run],
  );

  const checkout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await call<{ url?: string }>(`${base}/checkout`, { method: "POST" });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError("Checkout couldn't start.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }, [base]);

  return { cart, busy, error, add, setQuantity, remove, checkout };
}

/**
 * Search + paging over the storefront's product API, for one fixed category.
 *
 * Category switching is real navigation now (a `<Link>` to `?category=...`
 * in `ProductsListingView`, not client state here) — a category is a small,
 * finite, worth-crawling set of real destinations, unlike a keyword search,
 * which stays purely client-side (deliberately `noindex`d, see
 * `products/page.tsx`). That means `initial`/`initialTotal`/`initialCategory`
 * would otherwise go stale across such a navigation, since Next reuses the
 * same component instance for a client-side transition within one route —
 * fixed not with an effect that re-syncs local state (a real anti-pattern:
 * a synchronous `setState` in an effect just to mirror a prop is exactly
 * what "You Might Not Need an Effect" warns about, and this repo's lint
 * config enforces it) but by `ProductsListingView` keying the component
 * that calls this hook on `category`/`page` — a changed key remounts it,
 * which re-runs every `useState(...)` here against the fresh props for
 * free. See storefront-pages.tsx's `<ProductsListingView key=.../>`.
 */
export function useStorefrontProducts(
  storeId: string,
  initial: ApiProduct[],
  initialTotal: number,
  initialCategory: string,
  initialPage: number,
) {
  const base = `/api/storefront/${storeId}`;
  const [products, setProducts] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (nextPage: number, q: string, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(nextPage), q });
        if (initialCategory) params.set("category", initialCategory);
        const res = await call<{ products: ApiProduct[]; total: number }>(`${base}/products?${params}`);
        setProducts((prev) => (append ? [...prev, ...res.products] : res.products));
        setTotal(res.total);
        setPage(nextPage);
      } catch {
        // Leave the current list in place — a failed page shouldn't blank the store.
      } finally {
        setLoading(false);
      }
    },
    [base, initialCategory],
  );

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      void fetchPage(1, q, false);
    },
    [fetchPage],
  );

  const loadMore = useCallback(() => void fetchPage(page + 1, query, true), [fetchPage, page, query]);

  return { products, total, loading, query, search, loadMore, hasMore: products.length < total };
}
