"use client";

import { useEffect, useState } from "react";
import type { PlanMedia, StorePlan } from "@/lib/ecomai";

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
export function StoreSections({ plan }: { plan: StorePlan }) {
  const sections = plan.sections ?? [];
  if (!sections.length) return null;

  return (
    <div className="flex flex-col gap-20">
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
                className="mb-8 text-center text-2xl font-semibold"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
              >
                {heading}
              </h2>
            )}

            {s.type === "features" ? (
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
