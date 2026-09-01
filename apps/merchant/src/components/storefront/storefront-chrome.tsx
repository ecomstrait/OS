"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Plus, Minus, Loader2, X } from "lucide-react";
import type { Storefront } from "@/lib/storefront";
import { useStorefrontCart } from "@/components/storefront/use-storefront";
import { NewsletterForm } from "@/components/storefront/newsletter-form";

/**
 * Header, cart drawer, and footer — the chrome every storefront page shares
 * (the homepage, and the product detail page). Pulled out of what used to be
 * one monolithic `StorefrontView` so a second page (the product detail view)
 * doesn't have to duplicate the cart drawer or re-fetch the cart separately —
 * one `useStorefrontCart` call here, shared down through context, so the
 * header's cart badge and a product page's "Add to cart" always agree.
 */

type CartApi = ReturnType<typeof useStorefrontCart>;
const CartContext = createContext<CartApi | null>(null);

export function useStorefrontCartContext(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useStorefrontCartContext must be used inside <StorefrontChrome>");
  return ctx;
}

export type NavLink = { label: string; href: string };

export function StorefrontChrome({
  store,
  navLinks,
  basePath,
  children,
}: {
  store: Storefront;
  navLinks: NavLink[];
  /** `/store/<uuid>` on the id-path route, `""` on a connected domain. */
  basePath: string;
  children: React.ReactNode;
}) {
  const cartApi = useStorefrontCart(store.id);
  const { cart, busy, error, setQuantity, remove, checkout } = cartApi;
  const [open, setOpen] = useState(false);
  const line = "color-mix(in srgb, var(--ink) 12%, transparent)";
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";

  return (
    <CartContext.Provider value={cartApi}>
      {store.plan.announcement && (
        <div
          className="px-4 py-2.5 text-center text-xs font-semibold"
          style={{ background: "var(--brand)", color: "#fff", letterSpacing: "0.04em" }}
        >
          {store.plan.announcement}
        </div>
      )}

      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)", borderColor: line }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={basePath || "/"} className="shrink-0">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-7 object-contain" />
            ) : (
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.02em" }}
              >
                {store.name}
              </span>
            )}
          </Link>

          {navLinks.length > 0 && (
            <nav className="hidden items-center gap-8 sm:flex">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-xs font-semibold uppercase opacity-70 transition hover:opacity-100"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <button
            onClick={() => setOpen(true)}
            className="relative grid h-9 w-9 place-items-center transition hover:opacity-60"
            aria-label={`Cart, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.itemCount > 0 && (
              <span
                className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {children}

      <footer className="border-t px-6 py-14" style={{ borderColor: line }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          {navLinks.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-6">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-xs font-semibold uppercase opacity-60 transition hover:opacity-100"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase opacity-70" style={{ letterSpacing: "0.1em" }}>
              Stay in the loop
            </p>
            <NewsletterForm storeId={store.id} />
          </div>
          <p className="text-xs opacity-50" style={{ letterSpacing: "0.04em" }}>
            {store.plan.footerText || `${store.name} · Powered by EcomStrait`}
          </p>
        </div>
      </footer>

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col shadow-2xl"
            style={{ background: "var(--bg)", color: "var(--ink)" }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: line }}>
              <p className="text-sm font-semibold uppercase" style={{ letterSpacing: "0.08em" }}>
                Your cart
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-60 hover:opacity-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.removed.length > 0 && (
                <p
                  className="mb-4 px-3 py-2 text-xs"
                  style={{ borderRadius: "var(--radius)", background: "color-mix(in srgb, #f59e0b 15%, var(--bg))" }}
                >
                  {cart.removed.length} item{cart.removed.length === 1 ? " was" : "s were"} removed —
                  no longer available.
                </p>
              )}
              {cart.adjusted.length > 0 && (
                <p
                  className="mb-4 px-3 py-2 text-xs"
                  style={{ borderRadius: "var(--radius)", background: "color-mix(in srgb, #f59e0b 15%, var(--bg))" }}
                >
                  Quantities reduced to the stock on hand.
                </p>
              )}

              {cart.lines.length === 0 ? (
                <p className="text-sm opacity-50">Your cart is empty.</p>
              ) : (
                <ul className="flex flex-col gap-5">
                  {cart.lines.map((l) => (
                    <li key={l.productId} className="flex items-center gap-3">
                      <span
                        className="h-14 w-14 shrink-0 overflow-hidden"
                        style={{ background: surface, borderRadius: "var(--radius)" }}
                      >
                        {l.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">{l.title}</p>
                        <p className="text-xs opacity-60">${l.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(l.productId, l.quantity - 1)}
                          disabled={busy}
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center border opacity-70 disabled:opacity-30"
                          style={{ borderColor: line, borderRadius: "var(--radius)" }}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.productId, l.quantity + 1)}
                          disabled={busy || l.quantity >= l.available}
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center border opacity-70 disabled:opacity-30"
                          style={{ borderColor: line, borderRadius: "var(--radius)" }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(l.productId)}
                          disabled={busy}
                          aria-label={`Remove ${l.title}`}
                          className="ml-1 grid h-7 w-7 place-items-center opacity-50 transition hover:text-red-500 hover:opacity-100 disabled:opacity-30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t p-6" style={{ borderColor: line }}>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="opacity-60">Subtotal</span>
                <span className="font-semibold">${cart.subtotal.toFixed(2)}</span>
              </div>
              {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
              <button
                onClick={checkout}
                disabled={busy || cart.lines.length === 0}
                className="inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold uppercase text-white transition hover:opacity-85 disabled:opacity-40"
                style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.08em" }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}
