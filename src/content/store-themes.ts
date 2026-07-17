/**
 * Rich, per-store content that powers the one-page storefront demos at
 * /store/[slug]. Keyed by the StoreTemplate slug in gallery.ts.
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
  lumiere: {
    variant: "split",
    heroKicker: "New Season Glow",
    heroTitle: "Clean beauty, elevated",
    heroSubtitle: "Skin-first formulas made with ingredients you can pronounce — cruelty-free, dermatologist-tested, and endlessly wearable.",
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
    quote: { text: "My skin has never looked better. The Radiance Serum is pure magic.", author: "Ayesha K." },
  },
  northfield: {
    variant: "split",
    heroKicker: "Fall / Winter Edit",
    heroTitle: "Everyday essentials, elevated",
    heroSubtitle: "Timeless, well-made wardrobe staples designed to layer, last, and go with everything you already own.",
    heroEmoji: "🧥",
    promo: "🚚 Free shipping & 60-day returns on all orders",
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
    quote: { text: "The quality is unreal for the price. My new go-to for basics.", author: "Daniel O." },
  },
  voltix: {
    variant: "split",
    heroKicker: "Tech that keeps up",
    heroTitle: "Gear engineered for the everyday",
    heroSubtitle: "Premium audio, charging, and smart accessories that just work — fast, reliable, and built to travel.",
    heroEmoji: "🎧",
    promo: "⚡ Save 15% when you bundle any two accessories",
    products: [
      { name: "Pulse ANC Earbuds", price: "$129", emoji: "🎧", collection: "Audio", tag: "Bestseller" },
      { name: "Studio Over-Ear Headphones", price: "$199", emoji: "🎙️", collection: "Audio" },
      { name: "100W GaN Charger", price: "$59", emoji: "🔌", collection: "Charging" },
      { name: "MagLink Power Bank", price: "$79", emoji: "🔋", collection: "Charging", tag: "New" },
      { name: "Braided USB-C Cable (2m)", price: "$19", emoji: "⚡", collection: "Cables" },
      { name: "Smart Desk Hub", price: "$89", emoji: "🖥️", collection: "Smart Home" },
    ],
    features: [
      { title: "2-year warranty", description: "Every device covered, no questions asked." },
      { title: "Fast, free shipping", description: "Ships same day, arrives in 2–3 days." },
      { title: "Tested & certified", description: "Safety-certified components you can trust." },
    ],
    quote: { text: "Battery life is incredible and they pair instantly. Highly recommend.", author: "Marcus L." },
  },
  rooted: {
    variant: "spotlight",
    heroKicker: "Warm, modern living",
    heroTitle: "Furniture that feels like home",
    heroSubtitle: "Sustainably crafted pieces with clean lines and natural materials — made to be lived in for decades.",
    heroEmoji: "🛋️",
    promo: "🏡 Complimentary design consultation with every order",
    products: [
      { name: "Oak Lounge Chair", price: "$540", emoji: "🪑", collection: "Seating", tag: "Bestseller" },
      { name: "Linen Modular Sofa", price: "$1,880", emoji: "🛋️", collection: "Seating" },
      { name: "Walnut Coffee Table", price: "$420", emoji: "🪵", collection: "Tables", tag: "New" },
      { name: "Woven Pendant Light", price: "$160", emoji: "💡", collection: "Lighting" },
      { name: "Ceramic Table Lamp", price: "$120", emoji: "🔦", collection: "Lighting" },
      { name: "Solid Ash Bed Frame", price: "$960", emoji: "🛏️", collection: "Bedroom" },
    ],
    features: [
      { title: "Sustainably sourced", description: "FSC-certified wood and natural, low-VOC finishes." },
      { title: "White-glove delivery", description: "We deliver and assemble in your space." },
      { title: "10-year guarantee", description: "Built to last, and backed for a decade." },
    ],
    quote: { text: "Beautiful craftsmanship. The oak chair is the centerpiece of our home.", author: "Priya N." },
  },
  peak: {
    variant: "spotlight",
    heroKicker: "Gear up, go further",
    heroTitle: "Performance gear for every mile",
    heroSubtitle: "Trail-tested apparel and equipment built to move with you — from morning runs to summit pushes.",
    heroEmoji: "👟",
    promo: "🏔️ Members earn 2× points on all gear this week",
    products: [
      { name: "Trailblazer Running Shoe", price: "$140", emoji: "👟", collection: "Footwear", tag: "Bestseller" },
      { name: "Featherlite Wind Jacket", price: "$110", emoji: "🧥", collection: "Apparel" },
      { name: "Compression Tights", price: "$68", emoji: "🩳", collection: "Apparel", tag: "New" },
      { name: "Merino Trail Socks", price: "$22", emoji: "🧦", collection: "Apparel" },
      { name: "Hydration Vest 5L", price: "$95", emoji: "🎒", collection: "Gear" },
      { name: "Recovery Foam Roller", price: "$38", emoji: "🧘", collection: "Recovery" },
    ],
    features: [
      { title: "Athlete-tested", description: "Designed with pro trail runners in the field." },
      { title: "Weatherproof", description: "Built to perform in rain, wind, and heat." },
      { title: "Free returns", description: "Try it on the trail — 30-day happy returns." },
    ],
    quote: { text: "These shoes carried me through my first ultra. Zero blisters.", author: "Sam R." },
  },
  aurora: {
    variant: "spotlight",
    heroKicker: "Everyday brilliance",
    heroTitle: "Fine jewelry for real life",
    heroSubtitle: "Ethically sourced gold and diamonds, designed to be worn every day and treasured for a lifetime.",
    heroEmoji: "💎",
    promo: "💎 Free engraving & gift wrapping on every piece",
    products: [
      { name: "Solitaire Pendant", price: "$320", emoji: "💎", collection: "Necklaces", tag: "Bestseller" },
      { name: "Pavé Huggie Hoops", price: "$180", emoji: "💠", collection: "Earrings" },
      { name: "Pearl Drop Earrings", price: "$150", emoji: "🤍", collection: "Earrings" },
      { name: "Stacking Band Trio", price: "$240", emoji: "💍", collection: "Rings", tag: "New" },
      { name: "Signet Ring", price: "$210", emoji: "🔆", collection: "Rings" },
      { name: "Baguette Tennis Bracelet", price: "$680", emoji: "✨", collection: "Bracelets" },
    ],
    features: [
      { title: "Conflict-free", description: "Responsibly sourced stones and recycled gold." },
      { title: "Lifetime warranty", description: "Complimentary cleaning and repairs, forever." },
      { title: "Free engraving", description: "Make it personal with a hidden message." },
    ],
    quote: { text: "Delicate, beautifully made, and I never take it off. Perfect.", author: "Elena V." },
  },
  harvest: {
    variant: "split",
    heroKicker: "Fresh, delivered",
    heroTitle: "Farm-fresh groceries at your door",
    heroSubtitle: "Seasonal produce, pantry staples, and local finds — hand-picked and delivered the same day.",
    heroEmoji: "🥬",
    promo: "🥬 Get $20 off your first delivery over $60",
    products: [
      { name: "Seasonal Veg Box", price: "$34", emoji: "🥬", collection: "Produce", tag: "Bestseller" },
      { name: "Sourdough Loaf", price: "$7", emoji: "🍞", collection: "Bakery" },
      { name: "Free-Range Eggs (12)", price: "$6", emoji: "🥚", collection: "Dairy", tag: "New" },
      { name: "Cold-Pressed Olive Oil", price: "$18", emoji: "🫒", collection: "Pantry" },
      { name: "Local Wildflower Honey", price: "$12", emoji: "🍯", collection: "Pantry" },
      { name: "Organic Coffee Beans", price: "$16", emoji: "☕", collection: "Pantry" },
    ],
    features: [
      { title: "Same-day delivery", description: "Order by noon, on your table by evening." },
      { title: "Locally sourced", description: "Direct from farms within 100 miles." },
      { title: "Freshness promise", description: "Not fresh? We refund it instantly." },
    ],
    quote: { text: "The produce is always crisp and the delivery is bang on time.", author: "Nadia H." },
  },
  pawsome: {
    variant: "split",
    heroKicker: "Happy pets, happy homes",
    heroTitle: "Everything your best friend needs",
    heroSubtitle: "Vet-approved food, toys, and essentials for dogs and cats — because they deserve the very best.",
    heroEmoji: "🐾",
    promo: "🐾 Subscribe & save 20% on food + free treats",
    products: [
      { name: "Grain-Free Dog Food", price: "$46", emoji: "🍖", collection: "Food", tag: "Bestseller" },
      { name: "Slow-Feeder Bowl", price: "$18", emoji: "🥣", collection: "Food" },
      { name: "Tough Chew Rope Toy", price: "$14", emoji: "🦴", collection: "Toys" },
      { name: "Catnip Mouse (3-pack)", price: "$11", emoji: "🐭", collection: "Toys" },
      { name: "Orthopedic Pet Bed", price: "$72", emoji: "🛏️", collection: "Comfort", tag: "New" },
      { name: "Oatmeal Pet Shampoo", price: "$16", emoji: "🧴", collection: "Grooming" },
    ],
    features: [
      { title: "Vet-approved", description: "Recommended by veterinarians nationwide." },
      { title: "Subscribe & save", description: "Never run out — flexible auto-delivery." },
      { title: "Happiness guarantee", description: "If they don't love it, we'll make it right." },
    ],
    quote: { text: "My pup goes wild for the treats and the bed is his new throne.", author: "Tom B." },
  },
  vitalis: {
    variant: "spotlight",
    heroKicker: "Care you can trust",
    heroTitle: "Health essentials, simplified",
    heroSubtitle: "Clinically-backed supplements and everyday wellness products, delivered discreetly to your door.",
    heroEmoji: "➕",
    promo: "➕ Free wellness consultation with your first order",
    products: [
      { name: "Daily Multivitamin", price: "$28", emoji: "💊", collection: "Supplements", tag: "Bestseller" },
      { name: "Vitamin D3 + K2", price: "$19", emoji: "☀️", collection: "Supplements" },
      { name: "Magnesium Glycinate", price: "$22", emoji: "🌙", collection: "Supplements" },
      { name: "Digital Thermometer", price: "$24", emoji: "🌡️", collection: "Devices", tag: "New" },
      { name: "Pulse Oximeter", price: "$34", emoji: "🫀", collection: "Devices" },
      { name: "Electrolyte Hydration Mix", price: "$26", emoji: "🧂", collection: "Hydration" },
    ],
    features: [
      { title: "Clinically formulated", description: "Third-party tested for purity and potency." },
      { title: "Pharmacist support", description: "Real advice from licensed professionals." },
      { title: "Discreet delivery", description: "Plain packaging, shipped fast and private." },
    ],
    quote: { text: "Trustworthy products and the consultation actually helped. Great service.", author: "Dr. Amir S." },
  },
  chapter: {
    variant: "split",
    heroKicker: "Stories worth keeping",
    heroTitle: "Your next great read awaits",
    heroSubtitle: "Handpicked books across every genre, curated by real readers — plus signed editions and cozy reading gifts.",
    heroEmoji: "📚",
    promo: "📚 Buy 2, get 1 free on all paperbacks this month",
    products: [
      { name: "The Midnight Atlas", price: "$18", emoji: "📖", collection: "Fiction", tag: "Bestseller" },
      { name: "Quiet Mornings (Poetry)", price: "$14", emoji: "📜", collection: "Fiction" },
      { name: "The Signed First Edition", price: "$40", emoji: "✍️", collection: "Fiction" },
      { name: "A History of Almost Everything", price: "$24", emoji: "📗", collection: "Non-Fiction", tag: "New" },
      { name: "Little Explorers Boxset", price: "$32", emoji: "🧸", collection: "Kids" },
      { name: "Linen Bookmark Set", price: "$9", emoji: "🔖", collection: "Gifts" },
    ],
    features: [
      { title: "Curated by readers", description: "Every title hand-picked, never algorithmic." },
      { title: "Signed editions", description: "Exclusive author-signed copies, while they last." },
      { title: "Carbon-neutral shipping", description: "Wrapped in recycled, plastic-free packaging." },
    ],
    quote: { text: "Their staff picks are always spot on. I've found so many gems here.", author: "Grace L." },
  },
  savory: {
    variant: "spotlight",
    heroKicker: "Order in, dine well",
    heroTitle: "Chef-crafted meals, delivered hot",
    heroSubtitle: "Seasonal dishes made from scratch with local ingredients — ready to enjoy at home in minutes.",
    heroEmoji: "🍽️",
    promo: "🍽️ Free dessert with every order over $40 tonight",
    products: [
      { name: "Truffle Mushroom Risotto", price: "$19", emoji: "🍚", collection: "Mains", tag: "Bestseller" },
      { name: "Wood-Fired Margherita", price: "$16", emoji: "🍕", collection: "Mains" },
      { name: "Herb-Crusted Salmon", price: "$24", emoji: "🐟", collection: "Mains", tag: "New" },
      { name: "Burrata & Heirloom Salad", price: "$14", emoji: "🥗", collection: "Starters" },
      { name: "Molten Chocolate Cake", price: "$9", emoji: "🍫", collection: "Desserts" },
      { name: "House Lemonade (1L)", price: "$7", emoji: "🍋", collection: "Drinks" },
    ],
    features: [
      { title: "Made from scratch", description: "Cooked to order by our in-house chefs." },
      { title: "Locally sourced", description: "Fresh ingredients from nearby markets daily." },
      { title: "Hot & on time", description: "Insulated delivery keeps it restaurant-fresh." },
    ],
    quote: { text: "Tastes like dining out, without leaving the couch. Obsessed.", author: "Julia M." },
  },
  nest: {
    variant: "spotlight",
    heroKicker: "Make it yours",
    heroTitle: "Décor that tells your story",
    heroSubtitle: "Textiles, ceramics, and finishing touches to turn any space into somewhere you love to be.",
    heroEmoji: "🏺",
    promo: "🏠 Free throw pillow with any order over $75",
    products: [
      { name: "Handwoven Throw Blanket", price: "$64", emoji: "🧣", collection: "Textiles", tag: "Bestseller" },
      { name: "Tufted Accent Pillow", price: "$34", emoji: "🛋️", collection: "Textiles" },
      { name: "Rattan Storage Basket", price: "$42", emoji: "🧺", collection: "Textiles" },
      { name: "Stoneware Vase", price: "$38", emoji: "🏺", collection: "Ceramics" },
      { name: "Framed Line Art Print", price: "$46", emoji: "🖼️", collection: "Wall Art", tag: "New" },
      { name: "Soy Wax Candle — Cedar", price: "$24", emoji: "🕯️", collection: "Candles" },
    ],
    features: [
      { title: "Artisan-made", description: "Crafted by independent makers and studios." },
      { title: "Sustainable materials", description: "Natural fibers and responsibly-fired ceramics." },
      { title: "Easy 45-day returns", description: "Style it at home, no-risk and no-hassle." },
    ],
    quote: { text: "Every piece feels special. My living room finally feels finished.", author: "Sofia R." },
  },
};
