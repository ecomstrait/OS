"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, PackageCheck, BadgeCheck, ImageOff, Plus } from "lucide-react";
import type { PlanMedia, StorePlan } from "@/lib/ecomai";
import type { ApiProduct } from "@/lib/storefront-api";
import { useStorefrontCartContext } from "@/components/storefront/storefront-chrome";

/**
 * The parts of a storefront that render the merchant's own content.
 *
 * Shared because they had already drifted: the builder's preview panel was a
 * hand-written copy of this markup that never gained hero media, about media,
 * sections, the announcement bar or the footer note. A merchant could add an
 * image in Content, switch to Preview, and see nothing — the image was saved
 * and would have appeared on the live store, but the preview couldn't show it.
 *
 * Anything that renders plan content belongs here, so the preview and the live
 * storefront cannot disagree about what a store looks like.
 *
 * Every color here comes from the inherited `var(--ink)` (via opacity, never
 * a literal color class) or an explicit `var(--brand)`/`color-mix()` — so it
 * reads correctly on every theme, dark ones included. See
 * Docs/AI-Native-Migration-Plan.md-adjacent notes in storefront-view.tsx for
 * the bug this fixes: hardcoded `ink-*`/`white` Tailwind classes silently
 * broke every dark theme (Noir) — half the page still rendered light-mode
 * colors on a black background.
 */

/**
 * The hero backdrop: the merchant's images/videos as a crossfading carousel,
 * or the brand gradient when there's nothing to show.
 *
 * One item behaves exactly like the old single-image/video hero (no dots, no
 * autoplay — there's nothing to advance to). More than one adds dot
 * navigation and a slow auto-advance that stops for `prefers-reduced-motion`.
 * Must be the first child of a `position: relative` container — it paints
 * itself as absolutely-positioned layers rather than a CSS background so a
 * video can be one of the slides.
 */
export function HeroCarousel({
  media,
  gradient,
}: {
  media: PlanMedia[] | null | undefined;
  gradient: string;
}) {
  const items = media ?? [];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [items.length]);

  // A picked media item could disappear from under an already-open store
  // (deleted from the library) — clamp rather than render a blank slide.
  const current = Math.min(active, Math.max(0, items.length - 1));

  if (!items.length) {
    return <div className="absolute inset-0" style={{ background: gradient }} />;
  }

  return (
    <>
      {items.map((m, i) => (
        <div
          key={`${m.url}-${i}`}
          aria-hidden={i !== current}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {m.kind === "video" ? (
            <video
              src={m.url}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(10,10,12,.35), rgba(10,10,12,.62))" }}
          />
        </div>
      ))}

      {items.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1} of ${items.length}`}
              aria-current={i === current}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? "1.5rem" : "0.4rem",
                background: i === current ? "#fff" : "rgba(255,255,255,.5)",
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * The about paragraph and its optional image, side by side.
 *
 * Renders nothing when the merchant has supplied neither, rather than leaving
 * a bordered empty band on the page.
 */
export function AboutBlock({ plan }: { plan: StorePlan }) {
  const media = plan.aboutMedia ?? null;
  if (!plan.about && !media) return null;

  return (
    <div
      className="grid items-center gap-10 border-t pt-16 sm:grid-cols-2 sm:gap-16"
      style={{ borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)" }}
    >
      {media?.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.alt ?? ""}
          className="h-72 w-full object-cover sm:h-96"
          style={{ borderRadius: "var(--radius)" }}
        />
      )}
      <div className={media ? "" : "sm:col-span-2 mx-auto max-w-xl text-center"}>
        <p
          className="mb-4 text-xs font-semibold uppercase opacity-60"
          style={{ letterSpacing: "0.2em" }}
        >
          Our story
        </p>
        <p className="text-base leading-relaxed opacity-80">{plan.about}</p>
      </div>
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
export function StoreSections({
  plan,
  productsBySection,
  basePath = "",
  surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))",
}: {
  plan: StorePlan;
  /** `type: "products"` sections resolved to live product data, keyed by
   *  section id — see StorefrontHome, which fetches this server-side. */
  productsBySection?: Record<string, ApiProduct[]>;
  basePath?: string;
  surface?: string;
}) {
  const sections = plan.sections ?? [];
  if (!sections.length) return null;

  return (
    <div className="flex flex-col gap-20">
      {sections.map((s) => {
        const heading = s.heading?.trim();
        const body = s.body?.trim();
        const media = s.media ?? [];
        const items = s.items ?? [];
        const products = s.type === "products" ? (productsBySection?.[s.id] ?? []) : [];
        // A "products" section with nothing resolved (no picks yet, or every
        // pick got delisted) skips entirely — a heading over an empty grid
        // reads as broken, not as "coming soon".
        if (s.type === "products" ? !products.length : !heading && !body && !media.length && !items.length) {
          return null;
        }

        return (
          <section key={s.id}>
            {heading && (
              <h2
                className="mb-8 text-center text-2xl font-semibold"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
              >
                {heading}
              </h2>
            )}

            {s.type === "products" ? (
              <ProductGrid products={products} basePath={basePath} surface={surface} />
            ) : s.type === "features" ? (
              <div className="grid gap-8 sm:grid-cols-3">
                {items.map((it, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-semibold">{it.title}</p>
                    <p className="mt-2 text-sm leading-relaxed opacity-70">{it.description}</p>
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
                {body && <p className="mt-4 text-center text-sm leading-relaxed opacity-70">{body}</p>}
              </div>
            ) : s.type === "image" ? (
              <div className="grid items-center gap-10 sm:grid-cols-2">
                {media[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media[0].url}
                    alt={media[0].alt ?? ""}
                    className="h-72 w-full object-cover"
                    style={{ borderRadius: "var(--radius)" }}
                  />
                )}
                {body && <p className="text-base leading-relaxed opacity-80">{body}</p>}
              </div>
            ) : (
              body && (
                <p className="mx-auto max-w-2xl text-center text-base leading-relaxed opacity-80">
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

/**
 * Universal, honestly-true value props — not per-store data (there's no
 * reviews/ratings system to draw real numbers from), so this is deliberately
 * the same three claims on every store rather than invented star ratings or
 * review counts: real Stripe-secured checkout, cart pricing that only ever
 * reflects actual stock, and every product coming from a supplier who went
 * through this platform's own verification.
 */
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Secure checkout", detail: "Payments encrypted end to end" },
  { icon: PackageCheck, label: "Real-time stock", detail: "What you see is what ships" },
  { icon: BadgeCheck, label: "Vetted suppliers", detail: "Every product is supplier-verified" },
] as const;

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

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap gap-x-6 gap-y-2" : "grid gap-6 sm:grid-cols-3"}>
      {TRUST_ITEMS.map(({ icon: Icon, label, detail }) => (
        <div key={label} className={compact ? "flex items-center gap-2" : "flex items-start gap-3"}>
          <Icon className={compact ? "h-4 w-4 shrink-0 opacity-60" : "h-5 w-5 shrink-0 opacity-70"} />
          <div>
            <p className={compact ? "text-xs font-semibold" : "text-sm font-semibold"}>{label}</p>
            {!compact && <p className="mt-0.5 text-xs opacity-60">{detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
