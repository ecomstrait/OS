export type StoreTemplate = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  /** Two-stop gradient used for the preview mock (from, to). */
  gradient: [string, string];
  accent: string;
};

export const storeTemplates: StoreTemplate[] = [
  { slug: "lumiere", name: "Lumière", category: "Cosmetics", tagline: "Clean beauty, elevated", gradient: ["#fce7f3", "#fbcfe8"], accent: "#db2777" },
  { slug: "northfield", name: "NorthField", category: "Fashion", tagline: "Everyday essentials", gradient: ["#e0e7ff", "#c7d2fe"], accent: "#4f46e5" },
  { slug: "voltix", name: "Voltix", category: "Electronics", tagline: "Tech that keeps up", gradient: ["#dbeafe", "#bfdbfe"], accent: "#2563eb" },
  { slug: "rooted", name: "Rooted", category: "Furniture", tagline: "Warm, modern living", gradient: ["#fef3c7", "#fde68a"], accent: "#d97706" },
  { slug: "peak", name: "Peak", category: "Sports", tagline: "Gear up, go further", gradient: ["#dcfce7", "#bbf7d0"], accent: "#16a34a" },
  { slug: "aurora", name: "Aurora", category: "Jewelry", tagline: "Everyday brilliance", gradient: ["#ede9fe", "#ddd6fe"], accent: "#7c3aed" },
  { slug: "harvest", name: "Harvest", category: "Grocery", tagline: "Fresh, delivered", gradient: ["#ecfccb", "#d9f99d"], accent: "#65a30d" },
  { slug: "pawsome", name: "Pawsome", category: "Pet Store", tagline: "Happy pets, happy homes", gradient: ["#ffedd5", "#fed7aa"], accent: "#ea580c" },
  { slug: "vitalis", name: "Vitalis", category: "Medical", tagline: "Care you can trust", gradient: ["#cffafe", "#a5f3fc"], accent: "#0891b2" },
  { slug: "chapter", name: "Chapter", category: "Books", tagline: "Stories worth keeping", gradient: ["#fee2e2", "#fecaca"], accent: "#dc2626" },
  { slug: "savory", name: "Savory", category: "Restaurant", tagline: "Order in, dine well", gradient: ["#fef9c3", "#fef08a"], accent: "#ca8a04" },
  { slug: "nest", name: "Nest", category: "Home Decor", tagline: "Make it yours", gradient: ["#f3e8ff", "#e9d5ff"], accent: "#9333ea" },
];

export function getStoreBySlug(slug: string): StoreTemplate | undefined {
  return storeTemplates.find((s) => s.slug === slug);
}

export const galleryCategories = [
  "All", "Fashion", "Cosmetics", "Electronics", "Furniture", "Sports",
  "Jewelry", "Grocery", "Pet Store", "Medical", "Books", "Restaurant", "Home Decor",
];
