"use client";

import { useState } from "react";
import { Plus, Minus, ImageOff, Loader2 } from "lucide-react";
import type { Storefront } from "@/lib/storefront";
import type { ApiProduct, StorefrontNavLink } from "@/lib/storefront-api";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { StorefrontChrome, useStorefrontCartContext } from "@/components/storefront/storefront-chrome";

export function ProductDetailView({
  store,
  product,
  navLinks,
}: {
  store: Storefront;
  product: ApiProduct;
  navLinks: StorefrontNavLink[];
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";

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
      <StorefrontChrome store={store} navLinks={navLinks}>
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <a href={`/store/${store.id}/products`} className="mb-10 inline-block text-xs font-semibold uppercase opacity-60 hover:opacity-100" style={{ letterSpacing: "0.08em" }}>
            ← Back to shop
          </a>

          <div className="grid gap-10 sm:grid-cols-2 sm:gap-16">
            <Gallery product={product} surface={surface} />

            <div>
              {product.category && (
                <p className="mb-3 text-xs font-semibold uppercase opacity-50" style={{ letterSpacing: "0.18em" }}>
                  {product.category}
                </p>
              )}
              <h1
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
              >
                {product.title}
              </h1>
              <p className="mt-4 flex items-baseline gap-3 text-xl font-semibold">
                <span>{product.price != null ? `$${product.price}` : "—"}</span>
                {product.compareAtPrice != null && (
                  <span className="text-base font-normal opacity-45 line-through">${product.compareAtPrice}</span>
                )}
                {product.compareAtPrice != null && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
                    style={{ background: "var(--brand)", letterSpacing: "0.08em", borderRadius: "var(--radius)" }}
                  >
                    Sale
                  </span>
                )}
              </p>

              {product.description && (
                <p className="mt-6 max-w-md text-base leading-relaxed opacity-75">{product.description}</p>
              )}

              <div className="mt-8 border-t pt-8" style={{ borderColor: line }}>
                <AddToCart product={product} />
              </div>
            </div>
          </div>
        </section>
      </StorefrontChrome>
    </div>
  );
}

function Gallery({ product, surface }: { product: ApiProduct; surface: string }) {
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        className="aspect-[4/5] w-full overflow-hidden"
        style={{ background: surface, borderRadius: "var(--radius)" }}
      >
        {images[active] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[active]} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center opacity-30">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className="aspect-square overflow-hidden border-2 transition"
              style={{
                borderRadius: "var(--radius)",
                borderColor: i === active ? "var(--brand)" : "transparent",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" style={{ opacity: i === active ? 1 : 0.6 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddToCart({ product }: { product: ApiProduct }) {
  const { add, busy } = useStorefrontCartContext();
  const [qty, setQty] = useState(1);
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";

  if (!product.inStock) {
    return (
      <button
        disabled
        className="inline-flex h-12 w-full max-w-xs items-center justify-center text-sm font-semibold uppercase text-white opacity-40"
        style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.08em" }}
      >
        Sold out
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border" style={{ borderColor: line, borderRadius: "var(--radius)" }}>
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="grid h-12 w-10 place-items-center opacity-70 hover:opacity-100"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.available, q + 1))}
          disabled={qty >= product.available}
          aria-label="Increase quantity"
          className="grid h-12 w-10 place-items-center opacity-70 hover:opacity-100 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={() => add(product.id, qty)}
        disabled={busy}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold uppercase text-white transition hover:opacity-85 disabled:opacity-50"
        style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.08em" }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
      </button>
    </div>
  );
}
