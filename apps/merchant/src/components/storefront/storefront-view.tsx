"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Minus, Loader2, ImageOff, X, Search, Trash2 } from "lucide-react";
import type { Storefront } from "@/lib/storefront";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import type { ApiProduct } from "@/lib/storefront-api";
import { useStorefrontCart, useStorefrontProducts } from "@/components/storefront/use-storefront";

export function StorefrontView({
  store,
  initialProducts,
  initialTotal,
}: {
  store: Storefront;
  initialProducts: ApiProduct[];
  initialTotal: number;
}) {
  const [open, setOpen] = useState(false);
  const { cart, busy, error, add, setQuantity, remove, checkout } = useStorefrontCart(store.id);
  const { products, total, loading, search, loadMore, hasMore } = useStorefrontProducts(
    store.id,
    initialProducts,
    initialTotal,
  );
  const [term, setTerm] = useState("");

  // The theme sets the surface, typography and radius; the merchant's brand
  // colours override the accent. Without this every theme rendered the same
  // white storefront, and picking Noir or Forge changed nothing here.
  const t = storeTokens(store.theme, store.plan.brandColors);
  const hero = store.plan.heroMedia ?? null;
  const grad = `linear-gradient(135deg, ${t.brand}, ${t.accent})`;

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
      {store.plan.announcement && (
        <div
          className="px-4 py-2 text-center text-xs font-medium text-white"
          style={{ background: "var(--brand)" }}
        >
          {store.plan.announcement}
        </div>
      )}

      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b px-5 py-3 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)", borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
      >
        <div className="flex items-center gap-2">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="h-7 object-contain" />
          ) : (
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {store.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-ink-100"
          aria-label={`Cart, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
        >
          <ShoppingBag className="h-5 w-5 text-ink-700" />
          {cart.itemCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {cart.itemCount}
            </span>
          )}
        </button>
      </header>

      <section
        className="relative overflow-hidden px-6 py-16 text-center text-white"
        style={
          hero?.kind === "image"
            ? {
                backgroundImage: `linear-gradient(120deg, rgba(15,23,42,.55), rgba(15,23,42,.25)), url('${hero.url}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: grad }
        }
      >
        {hero?.kind === "video" && (
          <>
            {/* Decorative: muted, looping and inert, so it never competes with
                the copy or traps keyboard focus. */}
            <video
              src={hero.url}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-ink-950/45" />
          </>
        )}
        <div className="relative">
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            {store.plan.heroHeadline}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{store.plan.heroSub}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        {store.plan.collections?.length ? (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {store.plan.collections.map((c) => (
              <span key={c} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
                {c}
              </span>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(term);
          }}
          className="mx-auto mb-8 flex max-w-md items-center gap-2 rounded-full border border-ink-200 px-4 py-1.5"
        >
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ink-400"
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                search("");
              }}
              aria-label="Clear search"
              className="text-ink-400 hover:text-ink-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {products.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">
            {loading ? "Loading…" : "No products found."}
          </p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col overflow-hidden border"
                  style={{ borderRadius: "var(--radius)", borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
                >
                  <div className="relative aspect-square shrink-0 overflow-hidden bg-ink-50">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-300">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}
                    {!p.inStock && (
                      <span className="absolute left-3 top-3 rounded-full bg-ink-950/85 px-2.5 py-1 text-[11px] font-semibold text-white">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="line-clamp-2 text-sm font-semibold">{p.title}</p>
                    <p className="text-sm font-bold">
                      {p.price != null ? `$${p.price}` : "—"}
                    </p>
                    <button
                      onClick={() => add(p.id, 1)}
                      disabled={busy || !p.inStock}
                      className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}
                    >
                      <Plus className="h-4 w-4" /> {p.inStock ? "Add to cart" : "Sold out"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load more ({products.length} of {total})
                </button>
              </div>
            )}
          </>
        )}

        {(store.plan.about || store.plan.aboutMedia) && (
          <div className="mt-12 grid items-center gap-6 border-t border-ink-100 pt-8 sm:grid-cols-2">
            {store.plan.aboutMedia?.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.plan.aboutMedia.url}
                alt={store.plan.aboutMedia.alt ?? ""}
                className="h-56 w-full object-cover"
                style={{ borderRadius: "var(--radius)" }}
              />
            )}
            <p
              className={`mx-auto max-w-lg text-sm leading-relaxed opacity-70 ${
                store.plan.aboutMedia ? "text-left" : "sm:col-span-2 text-center"
              }`}
            >
              {store.plan.about}
            </p>
          </div>
        )}

        <StoreSections plan={store.plan} />
      </section>

      <footer
        className="border-t px-6 py-6 text-center text-xs opacity-60"
        style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
      >
        {store.plan.footerText || `${store.name} · Powered by EcomStrait`}
      </footer>

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <p className="text-base font-bold text-ink-950">Your cart</p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-ink-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* The server drops lines that went unavailable — say so rather
                  than letting them vanish silently. */}
              {cart.removed.length > 0 && (
                <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {cart.removed.length} item{cart.removed.length === 1 ? " was" : "s were"} removed —
                  no longer available.
                </p>
              )}
              {cart.adjusted.length > 0 && (
                <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Quantities reduced to the stock on hand.
                </p>
              )}

              {cart.lines.length === 0 ? (
                <p className="text-sm text-ink-400">Your cart is empty.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {cart.lines.map((l) => (
                    <li key={l.productId} className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                        {l.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-ink-900">{l.title}</p>
                        <p className="text-xs text-ink-500">${l.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(l.productId, l.quantity - 1)}
                          disabled={busy}
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center rounded-md border border-ink-200 text-ink-500 disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.productId, l.quantity + 1)}
                          disabled={busy || l.quantity >= l.available}
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center rounded-md border border-ink-200 text-ink-500 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(l.productId)}
                          disabled={busy}
                          aria-label={`Remove ${l.title}`}
                          className="ml-1 grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-ink-100 p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-bold text-ink-950">${cart.subtotal.toFixed(2)}</span>
              </div>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <button
                onClick={checkout}
                disabled={busy || cart.lines.length === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The merchant's custom content blocks, rendered under the catalogue.
 *
 * Unknown or empty sections are skipped rather than rendered as gaps: the plan
 * is free-form JSON and a block half-filled in the editor shouldn't leave a
 * hole on a live storefront.
 */
function StoreSections({ plan }: { plan: Storefront["plan"] }) {
  const sections = plan.sections ?? [];
  if (!sections.length) return null;

  return (
    <div className="mt-12 space-y-12">
      {sections.map((s) => {
        const heading = s.heading?.trim();
        const body = s.body?.trim();
        const media = s.media ?? [];
        const items = s.items ?? [];
        if (!heading && !body && !media.length && !items.length) return null;

        return (
          <section key={s.id}>
            {heading && (
              <h2
                className="mb-3 text-center text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {heading}
              </h2>
            )}

            {s.type === "features" ? (
              <div className="grid gap-5 sm:grid-cols-3">
                {items.map((it, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-semibold">{it.title}</p>
                    <p className="mt-1 text-sm opacity-70">{it.description}</p>
                  </div>
                ))}
              </div>
            ) : s.type === "gallery" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {media.map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${m.url}-${i}`}
                    src={m.url}
                    alt={m.alt ?? ""}
                    className="aspect-square w-full object-cover"
                    style={{ borderRadius: "var(--radius)" }}
                  />
                ))}
              </div>
            ) : s.type === "video" ? (
              <div className="mx-auto max-w-3xl">
                {media[0] && (
                  <video
                    src={media[0].url}
                    controls
                    playsInline
                    className="w-full"
                    style={{ borderRadius: "var(--radius)" }}
                  />
                )}
                {body && <p className="mt-3 text-center text-sm opacity-70">{body}</p>}
              </div>
            ) : s.type === "image" ? (
              <div className="grid items-center gap-6 sm:grid-cols-2">
                {media[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media[0].url}
                    alt={media[0].alt ?? ""}
                    className="h-60 w-full object-cover"
                    style={{ borderRadius: "var(--radius)" }}
                  />
                )}
                {body && <p className="text-sm leading-relaxed opacity-80">{body}</p>}
              </div>
            ) : (
              body && (
                <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed opacity-80">
                  {body}
                </p>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}
