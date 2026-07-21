/**
 * Curated, **labeled/illustrative** knowledge base that grounds the EcomAI
 * builder. Each niche maps to one or more real templates under /public/themes.
 * Where a niche has multiple themes, the builder picks one at random and lets
 * the visitor "change the concept" to cycle through the others.
 *
 * Every number is an EXAMPLE range for a simulated preview — never live data.
 */

export type Niche = {
  slug: string;
  label: string;
  emoji: string;
  keywords: string[];
  /** Example gross-margin % range. */
  margin: [number, number];
  /** Example verified-supplier count range. */
  suppliers: [number, number];
  /** Example monthly-revenue $ range at a modest start. */
  monthlyRevenue: [number, number];
  productIdeas: string[];
  countries: string[];
  storeSlug?: string;
  /** Theme folders under /public/themes. Non-empty = available in the beta. */
  themes?: string[];
};

export const niches: Niche[] = [
  {
    slug: "fashion",
    label: "Fashion",
    emoji: "🧥",
    keywords: ["fashion", "streetwear", "outfit", "style", "boutique", "menswear", "womenswear"],
    margin: [35, 50], suppliers: [30, 70], monthlyRevenue: [3000, 12000],
    productIdeas: ["Everyday Essentials Tee", "Knit Sweater", "Statement Jacket", "Layering Set"],
    countries: ["United States", "United Kingdom", "Australia"],
    storeSlug: "northfield",
    themes: ["fashion-shop1", "fashion-shop2", "fashion-shop3"],
  },
  {
    slug: "clothing",
    label: "Clothing & Apparel",
    emoji: "👕",
    keywords: ["clothing", "clothes", "apparel", "t-shirt", "tshirt", "hoodie", "jeans", "dress", "shirt"],
    margin: [35, 52], suppliers: [30, 70], monthlyRevenue: [3000, 11000],
    productIdeas: ["Organic Cotton Tee", "Relaxed Hoodie", "Straight Jean", "Everyday Shirt"],
    countries: ["United States", "United Kingdom", "Canada"],
    storeSlug: "northfield",
    themes: ["clothing-shop1", "clothing-shop2", "clothing-shop3"],
  },
  {
    slug: "shoes",
    label: "Shoes & Footwear",
    emoji: "👟",
    keywords: ["shoes", "shoe", "sneakers", "sneaker", "footwear", "trainers", "boots", "running shoes", "heels"],
    margin: [35, 50], suppliers: [20, 45], monthlyRevenue: [3000, 12000],
    productIdeas: ["Everyday Sneaker", "Trail Runner", "Leather Boot", "Court Classic"],
    countries: ["United States", "Canada", "Australia"],
    storeSlug: "peak",
    themes: ["shoes-shop1", "shoes-shop2", "shoes-shop3"],
  },
  {
    slug: "cosmetics",
    label: "Cosmetics & Beauty",
    emoji: "💄",
    keywords: ["cosmetics", "makeup", "skincare", "beauty", "serum", "cream", "lipstick", "spf"],
    margin: [42, 58], suppliers: [25, 60], monthlyRevenue: [3000, 12000],
    productIdeas: ["Radiance Serum", "Tinted SPF", "Overnight Mask", "Everyday Glow Set"],
    countries: ["United States", "United Kingdom", "Canada"],
    storeSlug: "lumiere",
    themes: ["comsmatic-shop"],
  },
  {
    slug: "jewelry",
    label: "Jewelry",
    emoji: "💎",
    keywords: ["jewelry", "jewellery", "rings", "ring", "necklace", "earrings", "gold", "diamond", "bracelet"],
    margin: [45, 60], suppliers: [15, 40], monthlyRevenue: [4000, 15000],
    productIdeas: ["Solitaire Pendant", "Stacking Rings", "Huggie Hoops", "Tennis Bracelet"],
    countries: ["United States", "India", "United Kingdom"],
    storeSlug: "aurora",
    themes: ["Jewellery-shop"],
  },
  {
    slug: "watches",
    label: "Watches",
    emoji: "⌚",
    keywords: ["watch", "watches", "timepiece", "smartwatch", "wristwatch"],
    margin: [38, 52], suppliers: [15, 35], monthlyRevenue: [5000, 18000],
    productIdeas: ["Smart Fitness Watch", "Minimalist Automatic", "Leather Strap Set", "Gift Box Bundle"],
    countries: ["United States", "Germany", "United Arab Emirates"],
    storeSlug: "aurora",
    themes: ["watches-shop"],
  },
  {
    slug: "electronics",
    label: "Electronics & Phones",
    emoji: "📱",
    keywords: ["electronics", "smartphone", "phone", "mobile", "gadget", "gadgets", "tech", "laptop", "headphones", "audio"],
    margin: [28, 42], suppliers: [20, 50], monthlyRevenue: [4000, 16000],
    productIdeas: ["Flagship Smartphone", "Wireless Earbuds", "Fast Charger", "Smart Accessories"],
    countries: ["United States", "Germany", "Canada"],
    storeSlug: "voltix",
    themes: ["smartphones-shop"],
  },
  {
    slug: "grocery",
    label: "Grocery & Gourmet",
    emoji: "🥬",
    keywords: ["grocery", "groceries", "food", "organic", "gourmet", "pantry", "produce", "vegetables", "fruits", "snacks"],
    margin: [25, 40], suppliers: [15, 40], monthlyRevenue: [3000, 10000],
    productIdeas: ["Seasonal Produce Box", "Artisan Pantry Set", "Cold-Pressed Oils", "Coffee Subscription"],
    countries: ["United States", "United Kingdom", "Canada"],
    storeSlug: "harvest",
    themes: ["grocery-shop1", "grocery-shop2", "grocery-shop3"],
  },
  {
    slug: "pet",
    label: "Pet Supplies",
    emoji: "🐾",
    keywords: ["pet", "pets", "dog", "cat", "puppy", "kitten", "pet supplies", "pet food", "toys"],
    margin: [38, 52], suppliers: [18, 45], monthlyRevenue: [3000, 12000],
    productIdeas: ["Grain-Free Food", "Orthopedic Bed", "Chew Toys", "Grooming Kit"],
    countries: ["United States", "United Kingdom", "Canada"],
    storeSlug: "pawsome",
    themes: ["pets-shop"],
  },
  {
    slug: "books",
    label: "Books & Stationery",
    emoji: "📚",
    keywords: ["book", "books", "bookstore", "bookshop", "stationery", "reading", "novels", "ebooks"],
    margin: [30, 45], suppliers: [12, 30], monthlyRevenue: [2000, 9000],
    productIdeas: ["Bestseller Fiction", "Signed Editions", "Kids' Boxset", "Linen Bookmarks"],
    countries: ["United States", "United Kingdom", "Canada"],
    storeSlug: "chapter",
    themes: ["books-shop"],
  },
  {
    slug: "home-decor",
    label: "Home & Decor",
    emoji: "🏺",
    keywords: ["decor", "home decor", "interior", "furniture", "home", "decoration", "vase", "wall art", "lighting"],
    margin: [42, 58], suppliers: [15, 40], monthlyRevenue: [3000, 12000],
    productIdeas: ["Handwoven Throw", "Statement Lighting", "Ceramic Vase", "Framed Art Print"],
    countries: ["United States", "United Kingdom", "Australia"],
    storeSlug: "nest",
    themes: ["home-decore"],
  },
  {
    slug: "pillow",
    label: "Pillows & Bedding",
    emoji: "🛏️",
    keywords: ["pillow", "pillows", "cushion", "cushions", "bedding", "bed sheets", "duvet", "mattress"],
    margin: [40, 55], suppliers: [12, 30], monthlyRevenue: [3000, 11000],
    productIdeas: ["Memory Foam Pillow", "Linen Duvet Set", "Cushion Covers", "Weighted Blanket"],
    countries: ["United States", "United Kingdom", "Australia"],
    storeSlug: "nest",
    themes: ["pillow-shop"],
  },

  /* ---- Beta / coming-soon (no theme yet) ---- */
  {
    slug: "fragrance",
    label: "Perfumes & Fragrance",
    emoji: "🧴",
    keywords: ["perfume", "perfumes", "fragrance", "cologne", "scent", "attar", "eau de parfum"],
    margin: [40, 55], suppliers: [18, 40], monthlyRevenue: [4000, 14000],
    productIdeas: ["Signature Eau de Parfum", "Travel Spray Set", "Oud Collection", "Layering Kit"],
    countries: ["United States", "United Arab Emirates", "United Kingdom"],
    storeSlug: "lumiere",
  },
  {
    slug: "health",
    label: "Health & Wellness",
    emoji: "➕",
    keywords: ["health", "wellness", "supplements", "vitamins", "nutrition", "fitness supplements"],
    margin: [45, 60], suppliers: [15, 35], monthlyRevenue: [4000, 14000],
    productIdeas: ["Daily Multivitamin", "Magnesium Glycinate", "Electrolyte Mix", "Wellness Bundle"],
    countries: ["United States", "Canada", "United Kingdom"],
    storeSlug: "vitalis",
  },
];

/** Generic fallback when a free-text idea matches nothing specific. */
export const genericNiche: Niche = {
  slug: "general",
  label: "Your Product Line",
  emoji: "🛍️",
  keywords: [],
  margin: [30, 50], suppliers: [15, 45], monthlyRevenue: [3000, 12000],
  productIdeas: ["Hero Product", "Everyday Bestseller", "Premium Bundle", "Gift Set"],
  countries: ["United States", "United Kingdom", "Canada"],
};

/** Best-effort niche match from a free-text idea (keyword overlap). */
export function matchNiche(idea: string): Niche {
  const q = idea.toLowerCase();
  let best: Niche | null = null;
  let bestScore = 0;
  for (const n of niches) {
    let score = 0;
    for (const kw of n.keywords) if (q.includes(kw)) score += kw.length;
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best ?? genericNiche;
}

/** Niches with at least one live theme (the beta-available set). */
export function availableNiches(): Niche[] {
  return niches.filter((n) => n.themes && n.themes.length > 0);
}
