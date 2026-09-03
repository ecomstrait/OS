import type { StorePlan, PlanMedia, PlanSection } from "@/lib/ecomai";

/**
 * `stores.content` is a free-form JSON column, so a row can legitimately hold
 * `{}` (store created outside the builder) or a partial plan from an older
 * shape. Casting it straight to StorePlan makes the editor crash on the first
 * `plan.collections.map(...)`, so every read goes through this instead.
 */

const FALLBACK_COLORS = ["#0f172a", "#10b981", "#3b82f6"];

const SECTION_TYPES: PlanSection["type"][] = ["text", "image", "video", "gallery", "features", "products"];

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return clean.length ? clean : fallback;
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Media with no usable URL is dropped rather than repaired — a broken image on
 * a live storefront is worse than an absent one.
 */
function media(value: unknown): PlanMedia | null {
  const raw = obj(value);
  const url = typeof raw?.url === "string" ? raw.url.trim() : "";
  if (!url) return null;
  return {
    url,
    kind: raw?.kind === "video" ? "video" : "image",
    ...(typeof raw?.alt === "string" && raw.alt.trim() ? { alt: raw.alt } : {}),
  };
}

function mediaList(value: unknown): PlanMedia[] {
  if (!Array.isArray(value)) return [];
  return value.map(media).filter((m): m is PlanMedia => m !== null);
}

function sections(value: unknown): PlanSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, i): PlanSection | null => {
      const raw = obj(entry);
      if (!raw) return null;
      const type = SECTION_TYPES.includes(raw.type as PlanSection["type"])
        ? (raw.type as PlanSection["type"])
        : "text";
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((it) => obj(it))
            .filter((it): it is Record<string, unknown> => it !== null)
            .map((it) => ({ title: str(it.title, ""), description: str(it.description, "") }))
            .filter((it) => it.title || it.description)
        : [];

      const section: PlanSection = {
        // Ids drive React keys and reordering; a section written by an older
        // build may lack one, so fall back to something stable within the plan.
        id: str(raw.id, `section-${i}`),
        type,
        ...(str(raw.heading, "") ? { heading: str(raw.heading, "") } : {}),
        ...(str(raw.body, "") ? { body: str(raw.body, "") } : {}),
      };
      const m = mediaList(raw.media);
      if (m.length) section.media = m;
      if (items.length) section.items = items;
      const productIds = Array.isArray(raw.productIds)
        ? raw.productIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        : [];
      if (productIds.length) section.productIds = productIds;
      return section;
    })
    .filter((s): s is PlanSection => s !== null);
}

/** Coerce anything stored in `stores.content` into a complete, safe StorePlan. */
export function normalizePlan(content: unknown, storeName = "Your store"): StorePlan {
  const raw = obj(content) ?? {};

  const name = str(raw.storeName, storeName);
  // heroMedia used to be a single object; stores saved before the carousel
  // still have it that way, so accept either shape rather than silently
  // dropping every existing hero image on the next read.
  const heroMedia = mediaList(Array.isArray(raw.heroMedia) ? raw.heroMedia : [raw.heroMedia]);
  const aboutMedia = media(raw.aboutMedia);
  const blocks = sections(raw.sections);

  return {
    storeName: name,
    tagline: str(raw.tagline, ""),
    brandColors: strList(raw.brandColors, FALLBACK_COLORS),
    heroHeadline: str(raw.heroHeadline, name),
    heroSub: str(raw.heroSub, ""),
    about: str(raw.about, ""),
    collections: strList(raw.collections, []),
    seoTitle: str(raw.seoTitle, name),
    seoDescription: str(raw.seoDescription, ""),
    source: raw.source === "groq" ? "groq" : "preset",
    // Optional throughout, and omitted rather than defaulted — so a theme can
    // tell "the merchant left this blank" from "this store predates the field".
    ...(str(raw.announcement, "") ? { announcement: str(raw.announcement, "") } : {}),
    ...(heroMedia.length ? { heroMedia } : {}),
    ...(aboutMedia ? { aboutMedia } : {}),
    ...(blocks.length ? { sections: blocks } : {}),
    ...(str(raw.footerText, "") ? { footerText: str(raw.footerText, "") } : {}),
  };
}
