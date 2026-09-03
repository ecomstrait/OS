import { notFound } from "next/navigation";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";
import { THEME_TOKENS } from "@/lib/theme-tokens";
import { normalizePlan } from "@/lib/store-plan";
import type { ApiProduct } from "@/lib/storefront-api";

/**
 * A custom-website preview of a theme, for the gallery.
 *
 * Renders the real StorefrontView rather than a mock-up of it — a hand-written
 * approximation would drift from the component the moment either changed, and
 * a preview that lies about the product is worse than none.
 *
 * Interaction is disabled at the wrapper: there's no store behind this, so the
 * cart and search would fail if a visitor tried them.
 */

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(THEME_TOKENS).map((theme) => ({ theme }));
}

// Demo catalog for the gallery — there's no real store behind this page, so
// every field (including category) is made up here, but only here: the
// bands below are grouped from these products' own `category`, the same way
// `listStoreCategories` groups a real catalog, not from a separate list.
const DEMO_PRODUCTS: ApiProduct[] = [
  {
    title: "Everyday Essential",
    category: "Apparel",
    price: 48,
    compareAtPrice: null,
    description:
      "Made from a heavyweight cotton blend, cut for a relaxed fit that holds its shape wash after wash.",
  },
  { title: "The Weekend Piece", category: "Apparel", price: 120, compareAtPrice: 150, description: null },
  { title: "Signature Edition", category: "Accessories", price: 86, compareAtPrice: null, description: null },
  { title: "Classic Staple", category: "Accessories", price: 64, compareAtPrice: 80, description: null },
  { title: "Limited Run", category: "Footwear", price: 145, compareAtPrice: null, description: null },
  { title: "The Daily Carry", category: "Footwear", price: 38, compareAtPrice: null, description: null },
].map((p, i) => ({
  id: `demo-${i}`,
  title: p.title,
  description: p.description,
  category: p.category,
  image: null,
  images: [],
  price: p.price,
  // A couple marked down, so the gallery preview also demonstrates the Sale
  // badge/section rather than leaving it permanently invisible here.
  compareAtPrice: p.compareAtPrice,
  available: 10,
  inStock: true,
}));

// Grouped the same way the real homepage groups categories — one band per
// category found on the products above, so this preview demonstrates the
// actual page shape without a second, hand-maintained list of categories.
const DEMO_BANDS: CategoryBand[] = [...new Set(DEMO_PRODUCTS.map((p) => p.category!))].map((category) => {
  const products = DEMO_PRODUCTS.filter((p) => p.category === category);
  return { category, products, total: products.length };
});

export default async function ThemePreviewPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  if (!THEME_TOKENS[theme]) notFound();

  const plan = normalizePlan({
    storeName: "Your Store",
    tagline: "Curated goods, delivered",
    heroHeadline: "Your brand, beautifully built",
    heroSub: "Curated products, fast shipping, and a store designed to convert.",
    about:
      "We started this store to make great products easy to find and love. Every item is chosen for quality, value, and the experience it brings.",
    collections: ["Best Sellers", "New Arrivals", "Featured"],
    announcement: "Free shipping on orders over $50",
    sections: [
      {
        id: "s1-features",
        type: "features",
        heading: "Why shop with us",
        items: [
          { title: "Free shipping", description: "On every order over $50, no code needed." },
          { title: "30-day returns", description: "Changed your mind? Send it back." },
          { title: "Secure checkout", description: "Every payment protected end to end." },
        ],
      },
    ],
  });

  return (
    <div style={{ pointerEvents: "none" }} aria-hidden>
      <StorefrontView
        store={{
          id: `preview-${theme}`,
          name: "Your Store",
          logoUrl: null,
          theme,
          status: "preview",
          plan,
          products: [],
        }}
        navLinks={[
          // Same categories as DEMO_BANDS — not a second hardcoded list.
          // Distinct hrefs, not all "#": StorefrontChrome keys each link
          // (header nav, mobile drawer, footer nav) by `href` — every link
          // sharing the literal string "#" made React see duplicate keys in
          // all three lists at once (confirmed via console: "Encountered two
          // children with the same key, `#`").
          ...DEMO_BANDS.map((b) => ({ label: b.category, href: `#${b.category}` })),
          { label: "Shop all", href: "#shop-all" },
          { label: "Sale", href: "#sale" },
          { label: "About", href: "#about" },
        ]}
        categoryBands={DEMO_BANDS}
        basePath={`/store/preview-${theme}`}
        previewMode
      />
    </div>
  );
}
