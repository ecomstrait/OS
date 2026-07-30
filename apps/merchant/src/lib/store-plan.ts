import type { StorePlan } from "@/lib/ecomai";

/**
 * `stores.content` is a free-form JSON column, so a row can legitimately hold
 * `{}` (store created outside the builder) or a partial plan from an older
 * shape. Casting it straight to StorePlan makes the editor crash on the first
 * `plan.collections.map(...)`, so every read goes through this instead.
 */

const FALLBACK_COLORS = ["#0f172a", "#10b981", "#3b82f6"];

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return clean.length ? clean : fallback;
}

/** Coerce anything stored in `stores.content` into a complete, safe StorePlan. */
export function normalizePlan(content: unknown, storeName = "Your store"): StorePlan {
  const raw =
    content && typeof content === "object" && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : {};

  const name = str(raw.storeName, storeName);
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
  };
}
