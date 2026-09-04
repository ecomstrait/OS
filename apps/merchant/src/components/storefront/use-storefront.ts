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
  // Which specific action(s) are in flight, keyed per-button (e.g.
  // `add:${productId}`) rather than one shared flag — so a click on one
  // "Add to cart" only ever shows a loading state on THAT button, not every
  // button on the page. See `isPending` below.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  // The cart itself is still a single, unversioned cookie (see
  // `storefront-api.ts`'s `mutateCart`/`writeCart`) that each request fully
  // reads then overwrites — two mutations genuinely in flight at once (add A,
  // add B, before either's Set-Cookie has landed) would race and silently
  // drop one. Queuing every mutation through this one ref keeps that
  // impossible without going back to disabling the whole cart while any one
  // action runs — only the key passed in shows as pending, everything else
  // stays fully interactive.
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const addPending = useCallback((key: string) => {
    setPendingKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);
  const removePending = useCallback((key: string) => {
    setPendingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);
  const isPending = useCallback((key: string) => pendingKeys.has(key), [pendingKeys]);

  const run = useCallback((key: string, fn: () => Promise<{ cart: PricedCart }>) => {
    addPending(key);
    setError(null);
    const task = queueRef.current.then(async () => {
      try {
        const { cart: next } = await fn();
        setCart(next);
        return next;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return null;
      } finally {
        removePending(key);
      }
    });
    queueRef.current = task.then(() => {});
    return task;
  }, [addPending, removePending]);

  // Hydrate from the server cart so a reload (or a return from Stripe) shows
  // the real basket rather than an empty one. Not tied to any button.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void run("hydrate", () => call<{ cart: PricedCart }>(`${base}/cart`));
  }, [base, run]);

  const add = useCallback(
    (productId: string, quantity = 1) =>
      run(`add:${productId}`, () =>
        call<{ cart: PricedCart }>(`${base}/cart`, {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        }),
      ),
    [base, run],
  );

  const setQuantity = useCallback(
    // `pendingKey` lets the caller distinguish its own "-" from "+" button
    // (both call this same function) — defaults to one shared key per line
    // if the caller doesn't care to split them.
    (productId: string, quantity: number, pendingKey = `qty:${productId}`) =>
      run(pendingKey, () =>
        call<{ cart: PricedCart }>(`${base}/cart`, {
          method: "PATCH",
          body: JSON.stringify({ productId, quantity }),
        }),
      ),
    [base, run],
  );

  const remove = useCallback(
    (productId: string) =>
      run(`remove:${productId}`, () =>
        call<{ cart: PricedCart }>(`${base}/cart?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        }),
      ),
    [base, run],
  );

  const checkout = useCallback(async () => {
    addPending("checkout");
    setError(null);
    const task = queueRef.current.then(async () => {
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
        removePending("checkout");
      }
    });
    queueRef.current = task;
    return task;
  }, [base, addPending, removePending]);

  return { cart, isPending, error, add, setQuantity, remove, checkout };
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
