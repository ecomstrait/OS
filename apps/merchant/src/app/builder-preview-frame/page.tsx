"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StorefrontView, ProductGrid, type CategoryBand } from "@/components/storefront/storefront-view";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { categoryLabel, UNCATEGORIZED } from "@/lib/storefront-shared";
import { cn } from "@ecomstrait/ui";
import type { Storefront } from "@/lib/storefront";
import type { ApiProduct, StorefrontNavLink } from "@/lib/storefront-api";
import { BUILDER_PREVIEW_READY, BUILDER_PREVIEW_DATA } from "@/lib/builder-preview-protocol";

/**
 * Bare preview target for the Store Builder (components/builder/store-builder.tsx),
 * used two ways:
 *
 *  - Embedded in the builder's own preview pane as an <iframe> — the device
 *    toggle there resizes this frame, not a container. Why an iframe and not
 *    just a width-constrained <div>: Tailwind's `sm:`/`md:` responsive
 *    classes compile to `@media (min-width: …)`, which is evaluated against
 *    the real browsing-context viewport — narrowing an ancestor <div>'s
 *    `max-width` never triggers them (that's what CSS container queries are
 *    for, and this codebase doesn't use them). An <iframe> is the one thing
 *    in HTML that gets its own real, independent viewport sized to its own
 *    rendered width, so putting the actual StorefrontView tree in one here
 *    is what makes that toggle genuinely show the mobile/tablet layout.
 *  - Opened directly via `window.open()` by the builder's "Live Preview"
 *    button — a full-tab look at the current draft, for a store that isn't
 *    published yet (or whose published version is behind the edits being
 *    made). Same page, same protocol: it doesn't care which one opened it.
 *
 * No server data, no auth: everything it renders arrives via postMessage
 * from whichever window opened it (the builder's live, unsaved draft
 * state), so this route needs nothing of its own and is safe to load
 * unauthenticated.
 *
 * Navigation: there's no real store id behind any of this, so the actual
 * `/store/[id]/products` etc. routes can't serve it (no row to look up —
 * for a draft that's never been saved, they'd 404; for a live store being
 * edited, they'd serve the last *saved* version, silently showing the wrong
 * thing for exactly the edits this preview exists to show). So "Shop all",
 * category cards, and product cards don't really navigate — clicking one
 * swaps which of three local views renders, all fed from the same payload,
 * with the URL bar never moving. `BASE_PATH` is just the prefix every link
 * in the payload already uses (built by store-builder.tsx to match what the
 * real site's links look like); it's never an actual route here.
 */

type Payload = {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categoryBands: CategoryBand[];
};

type View = { type: "home" } | { type: "products"; category: string } | { type: "product"; productId: string };

const READY = BUILDER_PREVIEW_READY;
const DATA = BUILDER_PREVIEW_DATA;
const BASE_PATH = "/store/preview";

/** The window that can plausibly have opened us: `window.open()` sets
 *  `opener`; being embedded as an <iframe> sets `parent` (≠ self). Neither
 *  is set when this URL is visited directly — then there's nothing to talk
 *  to, and the page just never receives data. */
function host(): Window | null {
  if (window.opener) return window.opener as Window;
  if (window.parent !== window) return window.parent;
  return null;
}

export default function BuilderPreviewFramePage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [view, setView] = useState<View>({ type: "home" });
  // A real new tab (not an <iframe>) — worth a banner so a merchant can't
  // mistake unsaved edits for the actual published site.
  const standalone = typeof window !== "undefined" && window.self === window.top;

  useEffect(() => {
    const h = host();
    if (!h) return;
    function onMessage(e: MessageEvent) {
      // Only the window that opened us, same-origin — this page is not
      // meant to be embedded/opened from anywhere else, and blindly
      // trusting postMessage from any origin would let another page in the
      // same browser feed it content.
      if (e.origin !== window.location.origin || e.source !== h) return;
      if (e.data?.type !== DATA) return;
      setPayload(e.data.payload as Payload);
    }
    window.addEventListener("message", onMessage);
    h.postMessage({ type: READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (payload?.store.name) document.title = `${payload.store.name} — Live preview`;
  }, [payload?.store.name]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Every product across every category band, deduped by id — the payload
  // groups products BY category, so a product with no category still shows
  // up here (its own UNCATEGORIZED band), and one that somehow appears in
  // two bands only counts once.
  const allProducts = useMemo(() => {
    const byId = new Map<string, ApiProduct>();
    for (const band of payload?.categoryBands ?? []) for (const p of band.products) byId.set(p.id, p);
    return [...byId.values()];
  }, [payload?.categoryBands]);

  const handleNavClick = useCallback((e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return; // not a link click — e.g. "Add to cart" — leave it alone
    const href = a.getAttribute("href");
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return; // external — let it open normally
    if (url.pathname === window.location.pathname) return; // e.g. href="#categories" — a same-page anchor, let the browser scroll to it
    if (!url.pathname.startsWith(BASE_PATH)) {
      e.preventDefault(); // looks internal but isn't a route this preview understands — block rather than 404
      return;
    }
    e.preventDefault();
    const rest = url.pathname.slice(BASE_PATH.length);
    if (rest === "" || rest === "/") {
      setView({ type: "home" });
    } else if (rest === "/products") {
      setView({ type: "products", category: url.searchParams.get("category") ?? "" });
    } else if (rest.startsWith("/products/")) {
      setView({ type: "product", productId: decodeURIComponent(rest.slice("/products/".length)) });
    } else {
      return; // blog/custom pages etc. — not supported in preview yet, no-op
    }
    if (url.hash) {
      const id = url.hash.slice(1);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }));
    }
  }, []);

  if (!payload) return null;

  return (
    <div onClickCapture={handleNavClick}>
      {standalone && (
        <div className="sticky top-0 z-50 bg-ink-950 px-4 py-2 text-center text-xs font-semibold text-white">
          Live preview — shows your latest unsaved changes, not necessarily what&apos;s published.
        </div>
      )}
      {view.type === "home" && (
        <StorefrontView
          store={payload.store}
          navLinks={payload.navLinks}
          categoryBands={payload.categoryBands}
          basePath={BASE_PATH}
          previewMode
        />
      )}
      {view.type === "products" && (
        <ProductsView
          store={payload.store}
          navLinks={payload.navLinks}
          categoryBands={payload.categoryBands}
          allProducts={allProducts}
          category={view.category}
        />
      )}
      {view.type === "product" &&
        (() => {
          const product = allProducts.find((p) => p.id === view.productId);
          if (!product) {
            return (
              <div className="grid min-h-screen place-items-center p-8 text-center text-sm opacity-60">
                That product isn&apos;t in this preview (removed, or never added).
              </div>
            );
          }
          return (
            <ProductDetailView store={payload.store} product={product} navLinks={payload.navLinks} basePath={BASE_PATH} previewMode />
          );
        })()}
    </div>
  );
}

/**
 * A local stand-in for ProductsListingView (components/storefront/products-listing-view.tsx)
 * — that one calls useStorefrontProducts, which fetches category/search
 * results from `/api/storefront/[storeId]/products`. There's no real store
 * id here for that to hit (or, for a live store being edited, it would hit
 * the real one and show the *saved* catalog, not the draft being edited —
 * wrong data, not just a missing feature). Category filtering here is a
 * plain client-side array filter instead, over the same products the
 * builder already sent.
 */
function ProductsView({
  store,
  navLinks,
  categoryBands,
  allProducts,
  category,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categoryBands: CategoryBand[];
  allProducts: ApiProduct[];
  category: string;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const pills = categoryBands.filter((b) => b.category !== UNCATEGORIZED);
  const filtered = category ? allProducts.filter((p) => p.category === category) : allProducts;

  return (
    <div
      className="min-h-screen"
      style={{ ...tokenStyle(t), background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-body)" }}
    >
      <StorefrontChrome store={store} navLinks={navLinks} basePath={BASE_PATH} previewMode>
        <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}>
            {category ? categoryLabel(category) : "Shop all"}
          </h1>
          {pills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 border-b pb-6" style={{ borderColor: line }}>
              <a
                href={`${BASE_PATH}/products`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition",
                  !category ? "border-transparent text-white" : "opacity-70 hover:opacity-100",
                )}
                style={{ borderColor: !category ? "transparent" : line, background: !category ? "var(--brand)" : undefined, letterSpacing: "0.06em" }}
              >
                All
              </a>
              {pills.map((b) => (
                <a
                  key={b.category}
                  href={`${BASE_PATH}/products?category=${encodeURIComponent(b.category)}`}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition",
                    category === b.category ? "border-transparent text-white" : "opacity-70 hover:opacity-100",
                  )}
                  style={{
                    borderColor: category === b.category ? "transparent" : line,
                    background: category === b.category ? "var(--brand)" : undefined,
                    letterSpacing: "0.06em",
                  }}
                >
                  {categoryLabel(b.category)} ({b.total})
                </a>
              ))}
            </div>
          )}
          <div className="mt-8">
            <ProductGrid products={filtered} basePath={BASE_PATH} surface={surface} />
          </div>
        </section>
      </StorefrontChrome>
    </div>
  );
}
