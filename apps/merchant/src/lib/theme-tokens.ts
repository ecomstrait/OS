/**
 * The design tokens behind each theme, in one place.
 *
 * These mirror the defaults in each Liquid package's `config/settings_data.json`
 * and are the single source of truth for three things that must agree:
 * the settings we push to Shopify, how the custom-website storefront renders,
 * and what the gallery preview shows. When they disagree, a merchant picks a
 * look in the gallery and gets a different one on their store.
 *
 * `bg` and `ink` are included deliberately. `settingsFromPlan` used to hardcode
 * a white background, which flattened Bloom's blush, Cove's cool grey, Forge's
 * stone and Marble's warm off-white into the same page — the tinted background
 * is a real part of each theme's identity.
 */

export type ThemeTokens = {
  brand: string;
  accent: string;
  ink: string;
  bg: string;
  /** Corner radius in px. 0 for Forge is a design choice, not a missing value. */
  radius: number;
  /** CSS font stack for headings, matching the theme's Shopify font setting. */
  headingFont: string;
  bodyFont: string;
  /** Noir is designed dark; previews and overlays need to know. */
  dark?: boolean;
};

// These names only resolve on the custom storefront (app/store/layout.tsx
// loads the actual font files via next/font/google — see that file for why).
// The Shopify Liquid path resolves its own `font_picker` settings through
// Shopify's platform instead, so it was never affected by this.
const BODY = "var(--font-assistant), ui-sans-serif, system-ui, sans-serif";
const POPPINS = "var(--font-poppins), ui-sans-serif, system-ui, sans-serif";

export const THEME_TOKENS: Record<string, ThemeTokens> = {
  aurora: {
    brand: "#10b981",
    accent: "#3b82f6",
    ink: "#0f172a",
    bg: "#ffffff",
    radius: 12,
    headingFont: BODY,
    bodyFont: BODY,
  },
  noir: {
    brand: "#C8A96A",
    accent: "#E8E2D6",
    // Fixed in noir's theme.liquid rather than driven by settings, so the
    // values here have to match that file, not the settings schema.
    ink: "#F4F1EC",
    bg: "#0B0B0C",
    radius: 2,
    headingFont: "var(--font-playfair), Georgia, serif",
    bodyFont: BODY,
    dark: true,
  },
  bloom: {
    brand: "#F472B6",
    accent: "#8B5CF6",
    ink: "#2E1A47",
    bg: "#FFFCFD",
    radius: 20,
    headingFont: POPPINS,
    bodyFont: POPPINS,
  },
  cove: {
    brand: "#38BDF8",
    accent: "#6366F1",
    ink: "#16233A",
    bg: "#FBFCFD",
    radius: 6,
    headingFont: "var(--font-lora), Georgia, serif",
    bodyFont: BODY,
  },
  forge: {
    brand: "#F59E0B",
    accent: "#EF4444",
    ink: "#17181A",
    bg: "#F4F4F2",
    radius: 0,
    headingFont: "var(--font-oswald), Impact, sans-serif",
    bodyFont: BODY,
  },
  marble: {
    brand: "#9DAED0",
    accent: "#E5E9F2",
    ink: "#2A2E35",
    bg: "#F7F7F5",
    radius: 4,
    headingFont: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
    bodyFont: BODY,
  },
};

export const DEFAULT_THEME_ID = "aurora";

export function themeTokens(id: string | null | undefined): ThemeTokens {
  return THEME_TOKENS[id ?? ""] ?? THEME_TOKENS[DEFAULT_THEME_ID];
}

/**
 * Tokens for a store: the theme's look, with the merchant's brand colours
 * layered on top where they set them.
 *
 * Brand wins over the theme because a merchant who told EcomAI "our colour is
 * teal" means it — but the surface, typography and radius stay the theme's, so
 * picking Forge still reads as Forge rather than as a recoloured Aurora.
 */
export function storeTokens(
  themeId: string | null | undefined,
  brandColors?: string[] | null,
): ThemeTokens {
  const base = themeTokens(themeId);
  const [brand, accent] = brandColors ?? [];
  return {
    ...base,
    ...(brand ? { brand } : {}),
    ...(accent ? { accent } : {}),
  };
}

/** Inline CSS custom properties, for a wrapper element or a preview document. */
export function tokenStyle(t: ThemeTokens): Record<string, string> {
  return {
    "--brand": t.brand,
    "--accent": t.accent,
    "--ink": t.ink,
    "--bg": t.bg,
    "--radius": `${t.radius}px`,
    "--font-heading": t.headingFont,
    "--font-body": t.bodyFont,
  };
}
