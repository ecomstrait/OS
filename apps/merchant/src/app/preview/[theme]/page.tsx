import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/storefront/storefront-view";
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

const DEMO_PRODUCTS: ApiProduct[] = [
  "Everyday Essential",
  "The Weekend Piece",
  "Signature Edition",
  "Classic Staple",
  "Limited Run",
  "The Daily Carry",
].map((title, i) => ({
  id: `demo-${i}`,
  title,
  description: null,
  category: null,
  image: null,
  images: [],
  price: [48, 120, 86, 64, 145, 38][i] ?? 50,
  available: 10,
  inStock: true,
}));

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
        initialProducts={DEMO_PRODUCTS}
        initialTotal={DEMO_PRODUCTS.length}
      />
    </div>
  );
}
