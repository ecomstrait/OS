/**
 * Rich, per-store content that powers the one-page storefront demos at
 * /store/[slug]. Keyed by the StoreTemplate slug in gallery.ts — which in turn
 * matches a real Liquid theme, so what a visitor previews here is what a
 * merchant actually gets.
 *
 * Each product carries an `emoji` (its "product photo") and a `collection`
 * so the storefront's nav actually filters the catalogue.
 */

export type Product = {
  name: string;
  price: string;
  emoji: string;
  collection: string;
  tag?: string;
};
export type Feature = { title: string; description: string };
export type Variant = "split" | "spotlight";

export type StoreTheme = {
  variant: Variant;
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroEmoji: string;
  promo: string;
  products: Product[];
  features: Feature[];
  quote: { text: string; author: string };
};

/** Ordered, de-duplicated collection list derived from a store's products. */
export function collectionsOf(theme: StoreTheme): string[] {
  const seen: string[] = [];
  for (const p of theme.products) if (!seen.includes(p.collection)) seen.push(p.collection);
  return seen;
}

export const storeThemes: Record<string, StoreTheme> = {
  aurora: {
    variant: "split",
    heroKicker: "New Season Edit",
    heroTitle: "Everyday essentials, elevated",
    heroSubtitle:
      "Timeless, well-made pieces designed to layer, last, and go with everything you already own. Clean design, quick checkout, nothing in the way.",
    heroEmoji: "🧥",
    promo: "🚚 Free shipping & 60-day returns on every order",
    products: [
      { name: "Merino Crew Sweater", price: "$88", emoji: "🧶", collection: "Tops", tag: "Bestseller" },
      { name: "Everyday Oxford Shirt", price: "$68", emoji: "👔", collection: "Tops" },
      { name: "Organic Cotton Tee", price: "$34", emoji: "👕", collection: "Tops" },
      { name: "Selvedge Straight Jean", price: "$120", emoji: "👖", collection: "Denim" },
      { name: "Wool Overcoat", price: "$248", emoji: "🧥", collection: "Outerwear", tag: "New" },
      { name: "Leather Chelsea Boot", price: "$180", emoji: "👢", collection: "Footwear" },
    ],
    features: [
      { title: "Responsibly made", description: "Ethically sourced fabrics from certified mills." },
      { title: "Built to last", description: "Reinforced seams and premium materials, guaranteed." },
      { title: "Free 60-day returns", description: "Not in love? Send it back, on us." },
    ],
    quote: {
      text: "The quality is unreal for the price. My new go-to for basics.",
      author: "Daniel O.",
    },
  },

  noir: {
    variant: "spotlight",
    heroKicker: "The Signature Collection",
    heroTitle: "Pieces worth keeping",
    heroSubtitle:
      "Solid gold, ethically sourced stones and a lifetime guarantee. Made in small batches by hand, for the things you'll never take off.",
    heroEmoji: "💍",
    promo: "🖤 Complimentary engraving and gift packaging",
    products: [
      { name: "Solitaire Pendant", price: "$420", emoji: "💎", collection: "Necklaces", tag: "Bestseller" },
      { name: "Fine Chain Necklace", price: "$260", emoji: "📿", collection: "Necklaces" },
      { name: "Signet Ring", price: "$340", emoji: "💍", collection: "Rings" },
      { name: "Pavé Eternity Band", price: "$780", emoji: "✨", collection: "Rings", tag: "New" },
      { name: "Huggie Hoops", price: "$180", emoji: "🪙", collection: "Earrings" },
      { name: "Onyx Cufflinks", price: "$220", emoji: "🖤", collection: "Accessories" },
    ],
    features: [
      { title: "Solid gold, never plated", description: "14k and 18k throughout — it won't fade or tarnish." },
      { title: "Ethically sourced", description: "Conflict-free stones with full provenance on request." },
      { title: "Lifetime guarantee", description: "Free cleaning, resizing and repair, for as long as you own it." },
    ],
    quote: {
      text: "I've worn the pendant every day for a year and it still looks new.",
      author: "Sofia R.",
    },
  },

  bloom: {
    variant: "split",
    heroKicker: "New Season Glow",
    heroTitle: "Clean beauty, elevated",
    heroSubtitle:
      "Skin-first formulas made with ingredients you can pronounce — cruelty-free, dermatologist-tested, and endlessly wearable.",
    heroEmoji: "💄",
    promo: "✨ Free deluxe sample on orders over $45",
    products: [
      { name: "Radiance Serum", price: "$38", emoji: "💧", collection: "Skincare", tag: "Bestseller" },
      { name: "Overnight Repair Mask", price: "$44", emoji: "🌙", collection: "Skincare" },
      { name: "Silk Lip Oil", price: "$22", emoji: "💄", collection: "Makeup" },
      { name: "Velvet Blush Duo", price: "$26", emoji: "🌷", collection: "Makeup" },
      { name: "Dewy Tint SPF 30", price: "$29", emoji: "☀️", collection: "Suncare", tag: "New" },
      { name: "The Glow Ritual Set", price: "$96", emoji: "✨", collection: "Sets & Kits", tag: "Value" },
    ],
    features: [
      { title: "Clean ingredients", description: "No parabens, sulfates, or synthetic fragrance — ever." },
      { title: "Cruelty-free", description: "Leaping Bunny certified and never tested on animals." },
      { title: "Dermatologist-tested", description: "Gentle enough for sensitive skin, backed by science." },
    ],
    quote: {
      text: "My skin has never looked better. The Radiance Serum is pure magic.",
      author: "Ayesha K.",
    },
  },

  cove: {
    variant: "spotlight",
    heroKicker: "Slow Living",
    heroTitle: "A calmer home starts here",
    heroSubtitle:
      "Natural materials, quiet colours and pieces made to be lived with. Everything we stock is chosen for how it feels, not how loud it is.",
    heroEmoji: "🕯️",
    promo: "🌿 Plastic-free packaging on every order",
    products: [
      { name: "Cedar & Sage Candle", price: "$34", emoji: "🕯️", collection: "Home", tag: "Bestseller" },
      { name: "Stoneware Mug Set", price: "$48", emoji: "☕", collection: "Home" },
      { name: "Linen Throw", price: "$92", emoji: "🧺", collection: "Textiles" },
      { name: "Waffle Bath Towel", price: "$38", emoji: "🛁", collection: "Textiles", tag: "New" },
      { name: "Magnesium Bath Soak", price: "$26", emoji: "🧂", collection: "Wellness" },
      { name: "Silk Sleep Mask", price: "$44", emoji: "😴", collection: "Wellness" },
    ],
    features: [
      { title: "Natural materials", description: "Linen, stoneware and untreated wood — nothing synthetic." },
      { title: "Small-batch makers", description: "Sourced from independent studios, not factories." },
      { title: "Plastic-free", description: "Recycled and compostable packaging, always." },
    ],
    quote: {
      text: "Everything arrived beautifully wrapped and feels genuinely special.",
      author: "Hana M.",
    },
  },

  forge: {
    variant: "split",
    heroKicker: "Built for the Job",
    heroTitle: "Gear that earns its keep",
    heroSubtitle:
      "Tools and outdoor kit tested where it matters. Over-engineered, field-repairable, and guaranteed for life — because replacing things is expensive.",
    heroEmoji: "🔧",
    promo: "🛠️ Lifetime guarantee on every tool we sell",
    products: [
      { name: "Impact Driver Kit", price: "$189", emoji: "🔩", collection: "Power Tools", tag: "Bestseller" },
      { name: "Precision Ratchet Set", price: "$96", emoji: "🔧", collection: "Hand Tools" },
      { name: "Heavy-Duty Tool Roll", price: "$64", emoji: "🧰", collection: "Storage" },
      { name: "1000lm Work Light", price: "$78", emoji: "🔦", collection: "Lighting", tag: "New" },
      { name: "Insulated Flask (1L)", price: "$42", emoji: "🥤", collection: "Outdoor" },
      { name: "Waxed Canvas Jacket", price: "$210", emoji: "🧥", collection: "Outdoor" },
    ],
    features: [
      { title: "Lifetime guarantee", description: "It breaks, we replace it. No receipt hunting." },
      { title: "Field-tested", description: "Every product used on real sites before we stock it." },
      { title: "Ships in 24 hours", description: "Ordered before 3pm? It leaves the same day." },
    ],
    quote: {
      text: "Been using the driver daily for two years. Still no complaints.",
      author: "Tom B.",
    },
  },

  marble: {
    variant: "spotlight",
    heroKicker: "The Considered Edit",
    heroTitle: "Refined things, chosen well",
    heroSubtitle:
      "A tight collection of accessories in full-grain leather, brushed steel and stone. Fewer pieces, better made, meant to outlast the season.",
    heroEmoji: "👜",
    promo: "🤍 Free monogramming on all leather goods",
    products: [
      { name: "Full-Grain Card Holder", price: "$78", emoji: "💳", collection: "Leather", tag: "Bestseller" },
      { name: "Structured Tote", price: "$320", emoji: "👜", collection: "Leather" },
      { name: "Brushed Steel Watch", price: "$460", emoji: "⌚", collection: "Watches", tag: "New" },
      { name: "Marble Desk Tray", price: "$88", emoji: "🪨", collection: "Desk" },
      { name: "Silk Twill Scarf", price: "$140", emoji: "🧣", collection: "Silk" },
      { name: "Leather Passport Cover", price: "$92", emoji: "🛂", collection: "Leather" },
    ],
    features: [
      { title: "Full-grain leather", description: "Vegetable-tanned, and it ages better than it arrives." },
      { title: "Monogramming included", description: "Hand-foiled initials at no extra cost." },
      { title: "Considered, not endless", description: "A short collection we actually stand behind." },
    ],
    quote: {
      text: "The card holder has aged beautifully — better than when I bought it.",
      author: "Idris N.",
    },
  },
};
