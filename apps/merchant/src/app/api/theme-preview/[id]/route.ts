import { getThemeFiles } from "@/lib/themes";
import { themeTokens } from "@/lib/theme-tokens";

export const runtime = "nodejs";

/**
 * A standalone preview page for a Liquid theme.
 *
 * Built from the theme's own `assets/theme.css` and its real class names, with
 * the same `:root` variables `layout/theme.liquid` injects — so what a merchant
 * sees here is the actual stylesheet, not an artist's impression. Liquid can't
 * run outside Shopify, so the markup is a faithful transcription of the theme's
 * sections rather than the sections themselves.
 *
 * Served as a document for an iframe: the theme's CSS is global and unscoped,
 * so rendering it inside the dashboard would restyle the dashboard.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const DEMO_PRODUCTS = [
  { title: "Everyday Essential", price: "$48.00" },
  { title: "The Weekend Piece", price: "$120.00" },
  { title: "Signature Edition", price: "$86.00" },
  { title: "Classic Staple", price: "$64.00" },
];

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const files = getThemeFiles(id);
  if (!files) return new Response("Unknown theme", { status: 404 });

  const css = files["assets/theme.css"] ?? "";
  const t = themeTokens(id);

  const cards = DEMO_PRODUCTS.map(
    (p) => `
      <div class="product-card">
        <div class="product-card__media" style="aspect-ratio:1;background:linear-gradient(135deg, ${t.brand}22, ${t.accent}33)"></div>
        <div class="product-card__info">
          <div class="product-card__title">${escapeHtml(p.title)}</div>
          <div class="price">${escapeHtml(p.price)}</div>
        </div>
      </div>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(id)} preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700&family=Lora:wght@400;600&family=Oswald:wght@400;700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --brand:${t.brand};
    --accent:${t.accent};
    --ink:${t.ink};
    --bg:${t.bg};
    --radius:${t.radius}px;
    --font-heading:${t.headingFont};
    --font-body:${t.bodyFont};
    --muted:color-mix(in srgb, var(--ink) 55%, var(--bg));
  }
  /* The preview isn't interactive — stop it inviting clicks that go nowhere. */
  a,button{cursor:default}
</style>
<style>${css}</style>
</head>
<body>
  <header class="header">
    <div class="container header__inner">
      <span class="header__logo">Your Store</span>
      <nav class="header__nav">
        <a href="#">Shop</a>
        <a href="#">New in</a>
        <a href="#">About</a>
      </nav>
      <span class="cart-count">2</span>
    </div>
  </header>

  <section class="hero">
    <div class="container hero__inner">
      <h1 class="hero__heading">Your brand, beautifully built</h1>
      <p class="hero__subheading">Curated products, fast shipping, and a store designed to convert.</p>
      <a href="#" class="btn btn-primary btn-lg">Shop now</a>
    </div>
  </section>

  <section class="container" style="padding:2.5rem 1rem">
    <div class="collection-head">
      <h2>Featured</h2>
      <a class="link-more" href="#">View all</a>
    </div>
    <div class="grid grid-products">${cards}</div>
  </section>

  <section class="container" style="padding:0 1rem 3rem">
    <div class="grid grid-3">
      <div><h3>Free shipping</h3><p class="muted">On every order over $50, no code needed.</p></div>
      <div><h3>30-day returns</h3><p class="muted">Changed your mind? Send it back.</p></div>
      <div><h3>Secure checkout</h3><p class="muted">Every payment protected end to end.</p></div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <p class="muted">Your Store &middot; Powered by EcomStrait</p>
    </div>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Themes are compiled into the bundle, so a preview only changes on deploy.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
