"use client";

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
 */

/**
 * Backdrop for the hero: the chosen image, else the brand gradient.
 *
 * A video can't be a CSS background, so it returns the gradient and
 * `HeroVideo` paints over the top — that way the hero still has a sensible
 * colour behind it while the video is loading or if it fails outright.
 */
export function heroBackdropStyle(
  media: PlanMedia | null | undefined,
  gradient: string,
): React.CSSProperties {
  if (media?.kind === "image") {
    return {
      backgroundImage: `linear-gradient(120deg, rgba(15,23,42,.55), rgba(15,23,42,.25)), url('${media.url}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: gradient };
}

/**
 * The hero's video layer, when the merchant picked a video.
 *
 * Decorative: muted, looping and inert, so it never competes with the copy or
 * traps keyboard focus. Renders nothing for an image or empty slot, so callers
 * can drop it in unconditionally.
 */
export function HeroVideo({ media }: { media: PlanMedia | null | undefined }) {
  if (media?.kind !== "video") return null;
  return (
    <>
      <video
        src={media.url}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink-950/45" />
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
    <div className="mt-12 grid items-center gap-6 border-t border-ink-100 pt-8 sm:grid-cols-2">
      {media?.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.alt ?? ""}
          className="h-56 w-full object-cover"
          style={{ borderRadius: "var(--radius)" }}
        />
      )}
      <p
        className={`mx-auto max-w-lg text-sm leading-relaxed opacity-70 ${
          media ? "text-left" : "sm:col-span-2 text-center"
        }`}
      >
        {plan.about}
      </p>
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
