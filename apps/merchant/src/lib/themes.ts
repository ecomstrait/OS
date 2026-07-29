import auroraFiles from "@/themes/generated/aurora.json";
import noirFiles from "@/themes/generated/noir.json";
import bloomFiles from "@/themes/generated/bloom.json";
import coveFiles from "@/themes/generated/cove.json";
import forgeFiles from "@/themes/generated/forge.json";
import marbleFiles from "@/themes/generated/marble.json";

/**
 * Registry of Liquid themes we upload to Shopify (Path 2 · shopify_liquid_theme).
 * One entry per theme; `styleId` matches the gallery/theme presets so
 * `themeForStyle()` selects the right package. Add niche themes one at a time.
 */
export type LiquidTheme = {
  id: string;
  name: string;
  niche: string;
  styleId: string;
  files: Record<string, string>;
};

export const LIQUID_THEMES: Record<string, LiquidTheme> = {
  aurora: {
    id: "aurora",
    name: "Aurora — EcomStrait",
    niche: "General / Fashion",
    styleId: "aurora",
    files: auroraFiles as Record<string, string>,
  },
  noir: {
    id: "noir",
    name: "Noir — EcomStrait",
    niche: "Luxury / Jewellery / Apparel",
    styleId: "noir",
    files: noirFiles as Record<string, string>,
  },
  bloom: {
    id: "bloom",
    name: "Bloom — EcomStrait",
    niche: "Lifestyle / Kids / Beauty",
    styleId: "bloom",
    files: bloomFiles as Record<string, string>,
  },
  cove: {
    id: "cove",
    name: "Cove — EcomStrait",
    niche: "Home / Wellness / Editorial",
    styleId: "cove",
    files: coveFiles as Record<string, string>,
  },
  forge: {
    id: "forge",
    name: "Forge — EcomStrait",
    niche: "Tools / Outdoor / Auto",
    styleId: "forge",
    files: forgeFiles as Record<string, string>,
  },
  marble: {
    id: "marble",
    name: "Marble — EcomStrait",
    niche: "Premium / Homeware / Accessories",
    styleId: "marble",
    files: marbleFiles as Record<string, string>,
  },
};

/** Files for a theme, or null if we don't ship a Liquid package for that id. */
export function getThemeFiles(id: string): Record<string, string> | null {
  return LIQUID_THEMES[id]?.files ?? null;
}

/** The Liquid theme for a given style id (falls back to aurora). */
export function liquidThemeForStyle(styleId: string | null | undefined): LiquidTheme {
  return LIQUID_THEMES[styleId ?? ""] ?? LIQUID_THEMES.aurora;
}
