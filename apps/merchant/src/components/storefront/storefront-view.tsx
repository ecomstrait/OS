"use client";

import { Plus, ImageOff } from "lucide-react";
import Link from "next/link";
import type { Storefront } from "@/lib/storefront";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import type { ApiProduct, StorefrontNavLink } from "@/lib/storefront-api";
import { categoryLabel } from "@/lib/storefront-shared";
import { StorefrontChrome, useStorefrontCartContext } from "@/components/storefront/storefront-chrome";
import {
  AboutBlock,
  HeroCarousel,
  StoreSections,
  TrustBadges,
} from "@/components/storefront/store-content";

/**
 * Every color below comes from the theme tokens — `var(--ink)`/`var(--bg)`/
 * `var(--brand)` or a `color-mix()` tint of one of them — never a hardcoded
 * Tailwind color utility. See storefront-chrome.tsx for why.
 *
 * The landing page is deliberately not a search/browse surface anymore —
 * that's what /store/[id]/products is for. This page's job is to sell the
 * store's categories, not to be a second, worse copy of the listing page.
 */

export type CategoryBand = {
  category: string;
  /** Preview only — "View all" on the card goes to the full, filterable listing. */
  products: ApiProduct[];
  total: number;
};

export function StorefrontView({
  store,
  navLinks,
  categoryBands,
  basePath,
  previewMode,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categoryBands: CategoryBand[];
  /** `/store/<uuid>` on the id-path route, `""` on a connected domain. */
  basePath: string;
  /** See StorefrontChrome — set inside the Store Builder's preview. */
  previewMode?: boolean;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const heroMedia = store.plan.heroMedia ?? [];
  const grad = `linear-gradient(135deg, ${t.brand}, ${t.accent})`;
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";

  // Derived from whatever's already on the homepage (the category previews)
  // rather than a separate query — an approximation (a markdown outside
  // every preview window won't surface here), documented rather than hidden.
  const previewed = categoryBands.flatMap((b) => b.products);
  const onSale = previewed.filter((p) => p.compareAtPrice != null);
  const spotlight = previewed.find((p) => p.description && p.image) ?? null;

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
      <StorefrontChrome store={store} navLinks={navLinks} basePath={basePath} previewMode={previewMode}>
        {/* ---- Hero — a real editorial moment, not a banner strip ---- */}
        <section className="relative flex min-h-[68vh] items-center overflow-hidden px-6 py-20 text-center text-white sm:min-h-[80vh]">
          <HeroCarousel media={heroMedia} gradient={grad} />
          <div className="relative mx-auto max-w-2xl">
            {store.plan.tagline && (
              <p className="mb-5 text-xs font-semibold uppercase text-white/80" style={{ letterSpacing: "0.28em" }}>
                {store.plan.tagline}
              </p>
            )}
            <h1
              className="text-balance font-semibold"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.25rem, 5.5vw, 4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {store.plan.heroHeadline}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-white/85 sm:text-lg">{store.plan.heroSub}</p>
            <a
              href="#categories"
              className="mt-9 inline-flex h-12 items-center justify-center px-8 text-sm font-semibold uppercase transition hover:opacity-85"
              style={{ background: "#fff", color: "#0a0a0c", borderRadius: "var(--radius)", letterSpacing: "0.1em" }}
            >
              Shop now
            </a>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-12" style={{ borderBottom: `1px solid ${line}` }}>
          <TrustBadges />
        </div>

        <section id="categories" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          {/* ---- Spotlight — one product, shown big, with its full
              description. ---- */}
          {spotlight && (
            <div className="mb-24 grid items-center gap-10 border-y py-14 sm:grid-cols-2 sm:gap-16" style={{ borderColor: line }}>
              <div className="aspect-[4/5] w-full overflow-hidden" style={{ background: surface, borderRadius: "var(--radius)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spotlight.image!} alt={spotlight.title} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="mb-4 text-xs font-semibold uppercase opacity-60" style={{ letterSpacing: "0.2em" }}>
                  Featured
                </p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}>
                  {spotlight.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed opacity-75">{spotlight.description}</p>
                <PriceTag product={spotlight} className="mt-6 text-lg" />
                <Link
                  href={`${basePath}/products/${spotlight.id}`}
                  className="mt-6 inline-flex h-11 items-center justify-center px-7 text-xs font-semibold uppercase text-white transition hover:opacity-85"
                  style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.08em" }}
                >
                  View product
                </Link>
              </div>
            </div>
          )}

          {/* ---- One band per category: a card, then that category's
              products underneath it. This is the entire browse surface on
              the landing page — no search, no filter pills here on
              purpose; that's what the listing page (linked from the card
              and the nav) is for. ---- */}
          <div className="flex flex-col gap-24">
            {categoryBands.map((band) => (
              <CategoryBand key={band.category} basePath={basePath} band={band} line={line} surface={surface} />
            ))}
          </div>

          {onSale.length > 0 && (
            <div id="sale" className="mt-24 scroll-mt-24">
              <p className="mb-10 text-center text-xs font-semibold uppercase opacity-60" style={{ letterSpacing: "0.2em" }}>
                On sale
              </p>
              <ProductGrid products={onSale} basePath={basePath} surface={surface} />
            </div>
          )}

          <div id="about" className="mt-24 scroll-mt-24">
            <AboutBlock plan={store.plan} />
          </div>

          {store.plan.sections?.length ? (
            <div className="mt-24">
              <StoreSections plan={store.plan} />
            </div>
          ) : null}
        </section>
      </StorefrontChrome>
    </div>
  );
}

function CategoryBand({
  basePath,
  band,
  line,
  surface,
}: {
  basePath: string;
  band: CategoryBand;
  line: string;
  surface: string;
}) {
  const href = `${basePath}/products?category=${encodeURIComponent(band.category)}`;
  const label = categoryLabel(band.category);
  const cardImage = band.products.find((p) => p.image)?.image ?? null;

  return (
    <div>
      {/* The category card — one per band, the entry point into that
          category's full, filterable listing. */}
      <Link
        href={href}
        className="group relative mb-8 block aspect-[21/9] w-full overflow-hidden sm:aspect-[3/1]"
        style={{ background: cardImage ? undefined : "linear-gradient(135deg, var(--brand), var(--accent))", borderRadius: "var(--radius)" }}
      >
        {cardImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImage}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.1))" }} />
          </>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white">
          <h2
            className="text-2xl font-semibold sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
          >
            {label}
          </h2>
          <span className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.14em" }}>
            Shop {label} ({band.total}) →
          </span>
        </div>
      </Link>

      <ProductGrid products={band.products} basePath={basePath} surface={surface} />

      {band.total > band.products.length && (
        <div className="mt-8 text-center">
          <Link
            href={href}
            className="inline-flex h-11 items-center gap-2 border px-6 text-xs font-semibold uppercase transition hover:opacity-70"
            style={{ borderRadius: "var(--radius)", borderColor: line, letterSpacing: "0.08em" }}
          >
            View all {band.total} in {label}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Price, with a struck-through "compare at" when this listing is a real markdown. */
export function PriceTag({ product, className = "" }: { product: ApiProduct; className?: string }) {
  return (
    <p className={`flex items-baseline gap-2 font-semibold ${className}`}>
      <span>{product.price != null ? `$${product.price}` : "—"}</span>
      {product.compareAtPrice != null && (
        <span className="text-sm font-normal opacity-45 line-through">${product.compareAtPrice}</span>
      )}
    </p>
  );
}

export function ProductGrid({
  products,
  basePath,
  surface,
}: {
  products: ApiProduct[];
  basePath: string;
  surface: string;
}) {
  const { add, busy } = useStorefrontCartContext();

  if (!products.length) {
    return <p className="py-10 text-center text-sm opacity-50">No products here yet.</p>;
  }

  return (
    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="group flex flex-col">
          <Link href={`${basePath}/products/${p.id}`} className="block">
            <div className="relative aspect-[4/5] shrink-0 overflow-hidden" style={{ background: surface, borderRadius: "var(--radius)" }}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="grid h-full w-full place-items-center opacity-30">
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {!p.inStock && (
                  <span
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase"
                    style={{ background: "var(--bg)", color: "var(--ink)", letterSpacing: "0.08em", borderRadius: "var(--radius)" }}
                  >
                    Sold out
                  </span>
                )}
                {p.compareAtPrice != null && (
                  <span
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase text-white"
                    style={{ background: "var(--brand)", letterSpacing: "0.08em", borderRadius: "var(--radius)" }}
                  >
                    Sale
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 pt-4">
              <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
              <PriceTag product={p} className="text-sm" />
            </div>
          </Link>
          <button
            onClick={() => add(p.id, 1)}
            disabled={busy || !p.inStock}
            className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 text-xs font-semibold uppercase text-white transition hover:opacity-85 disabled:opacity-40"
            style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.08em" }}
          >
            <Plus className="h-3.5 w-3.5" /> {p.inStock ? "Add to cart" : "Sold out"}
          </button>
        </div>
      ))}
    </div>
  );
}
