import auroraFiles from "@/themes/generated/aurora.json";

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
};

/** Files for a theme, or null if we don't ship a Liquid package for that id. */
export function getThemeFiles(id: string): Record<string, string> | null {
  return LIQUID_THEMES[id]?.files ?? null;
}

/** The Liquid theme for a given style id (falls back to aurora). */
export function liquidThemeForStyle(styleId: string | null | undefined): LiquidTheme {
  return LIQUID_THEMES[styleId ?? ""] ?? LIQUID_THEMES.aurora;
}
