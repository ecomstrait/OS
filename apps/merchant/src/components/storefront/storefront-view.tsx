"use client";

import { useMemo, useState } from "react";
import { ShoppingBag, Plus, Minus, Loader2, ImageOff, X } from "lucide-react";
import type { Storefront } from "@/lib/storefront";
import { checkoutStore } from "@/lib/storefront-actions";

export function StorefrontView({ store }: { store: Storefront }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grad = `linear-gradient(135deg, ${store.plan.brandColors?.[0] ?? "#0f172a"}, ${store.plan.brandColors?.[1] ?? "#10b981"})`;

  const lines = useMemo(
    () => Object.entries(cart).filter(([, q]) => q > 0).map(([productId, quantity]) => ({ productId, quantity })),
    [cart],
  );
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = useMemo(
    () => lines.reduce((s, l) => s + (store.products.find((p) => p.id === l.productId)?.price ?? 0) * l.quantity, 0),
    [lines, store.products],
  );

  function add(id: string, d: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  }

  async function checkout() {
    if (!lines.length) return;
    setLoading(true);
    setError(null);
    const res = await checkoutStore(store.id, lines);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.url) {
      window.location.href = res.url;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="h-7 object-contain" />
          ) : (
            <span className="text-lg font-bold text-ink-950">{store.name}</span>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-ink-100">
          <ShoppingBag className="h-5 w-5 text-ink-700" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{count}</span>
          )}
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center text-white" style={{ background: grad }}>
        <h1 className="text-3xl font-bold sm:text-4xl">{store.plan.heroHeadline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/85">{store.plan.heroSub}</p>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        {store.plan.collections?.length ? (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {store.plan.collections.map((c) => (
              <span key={c} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">{c}</span>
            ))}
          </div>
        ) : null}

        {store.products.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">This store has no products yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((p) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100">
                <div className="aspect-square bg-ink-50">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-ink-300"><ImageOff className="h-8 w-8" /></div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="line-clamp-1 text-sm font-semibold text-ink-950">{p.title}</p>
                  <p className="text-sm font-bold text-ink-900">{p.price != null ? `$${p.price}` : "—"}</p>
                  <button onClick={() => add(p.id, 1)} className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600">
                    <Plus className="h-4 w-4" /> Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-ink-100 pt-8 text-center">
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-ink-500">{store.plan.about}</p>
        </div>
      </section>

      <footer className="border-t border-ink-100 px-6 py-6 text-center text-xs text-ink-400">
        {store.name} · Powered by EcomStrait
      </footer>

      {/* Cart drawer */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <p className="text-base font-bold text-ink-950">Your cart</p>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5 text-ink-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {lines.length === 0 ? (
                <p className="text-sm text-ink-400">Your cart is empty.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {lines.map((l) => {
                    const p = store.products.find((x) => x.id === l.productId)!;
                    return (
                      <li key={l.productId} className="flex items-center gap-3">
                        <span className="h-12 w-12 overflow-hidden rounded-lg bg-ink-50">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-ink-900">{p.title}</p>
                          <p className="text-xs text-ink-500">${p.price ?? 0}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => add(l.productId, -1)} className="grid h-7 w-7 place-items-center rounded-md border border-ink-200 text-ink-500"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm">{l.quantity}</span>
                          <button onClick={() => add(l.productId, 1)} className="grid h-7 w-7 place-items-center rounded-md border border-ink-200 text-ink-500"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-ink-100 p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-bold text-ink-950">${total.toFixed(2)}</span>
              </div>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <button
                onClick={checkout}
                disabled={loading || lines.length === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
