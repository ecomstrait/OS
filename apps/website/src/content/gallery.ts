/**
 * The store templates shown on the marketing site.
 *
 * One entry per Liquid theme we actually ship (see LIQUID_THEMES in the
 * merchant app). They deliberately match by slug: the gallery used to advertise
 * twelve invented templates against six real packages, so eleven of them
 * silently fell back to Aurora once a merchant picked one. Anything added here
 * needs a real theme behind it.
 */

export type StoreTemplate = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  /** Two-stop gradient behind the product tiles (from, to). Keep it light. */
  gradient: [string, string];
  /** Used for text on white and as a background for white text — keep it dark. */
  accent: string;
};

export const storeTemplates: StoreTemplate[] = [
  {
    slug: "aurora",
    name: "Aurora",
    category: "Fashion",
    tagline: "Modern, minimal, conversion-first",
    gradient: ["#d1fae5", "#bfdbfe"],
    accent: "#059669",
  },
  {
    slug: "noir",
    name: "Noir",
    category: "Jewelry",
    tagline: "Dark, premium, high-contrast",
    gradient: ["#e2e8f0", "#cbd5e1"],
    accent: "#0f172a",
  },
  {
    slug: "bloom",
    name: "Bloom",
    category: "Beauty",
    tagline: "Colourful, friendly, lifestyle-led",
    gradient: ["#fce7f3", "#ede9fe"],
    accent: "#db2777",
  },
  {
    slug: "cove",
    name: "Cove",
    category: "Home & Wellness",
    tagline: "Soft, editorial, story-driven",
    gradient: ["#e0f2fe", "#e0e7ff"],
    accent: "#0284c7",
  },
  {
    slug: "forge",
    name: "Forge",
    category: "Outdoor & Tools",
    tagline: "Strong type, utilitarian, gear-ready",
    gradient: ["#ffedd5", "#fee2e2"],
    accent: "#ea580c",
  },
  {
    slug: "marble",
    name: "Marble",
    category: "Accessories",
    tagline: "Neutral, refined, timeless",
    gradient: ["#eef2f7", "#dbe3ee"],
    accent: "#475569",
  },
];

export function getStoreBySlug(slug: string): StoreTemplate | undefined {
  return storeTemplates.find((s) => s.slug === slug);
}

export const galleryCategories = [
  "All",
  "Fashion",
  "Jewelry",
  "Beauty",
  "Home & Wellness",
  "Outdoor & Tools",
  "Accessories",
];
