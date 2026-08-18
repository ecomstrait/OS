import { getThemeFiles } from "@/lib/themes";
import { themeTokens, type ThemeTokens } from "@/lib/theme-tokens";

export const runtime = "nodejs";

/**
 * A standalone preview page for a Liquid theme.
 *
 * Built from the theme's own `assets/theme.css` and `assets/theme.js`, with the
 * `:root` block lifted out of its `layout/theme.liquid` — so what a merchant
 * sees here is the actual theme, not an artist's impression. Liquid can't run
 * outside Shopify, so the markup is a transcription of the theme's sections
 * rather than the sections themselves.
 *
 * That transcription is the part that rots. The previous version still
 * referenced `.header`, `.header__nav`, `.product-card__info` and `.footer`,
 * none of which the themes have ever defined — they use `.site-header`,
 * `.site-nav`, `.product-card__body` and `.site-footer` — so a good part of the
 * preview was rendering unstyled. Anything changed here has to be checked
 * against the real section files.
 *
 * Served as a document for an iframe: the theme's CSS is global and unscoped,
 * so rendering it inside the dashboard would restyle the dashboard.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The theme's own custom properties, taken from its layout rather than
 * re-declared here.
 *
 * Each theme derives its own palette on top of the shared seven — Noir has
 * `--surface-2`, Forge `--rule`, Marble `--brand-deep`, and so on. A hand-kept
 * copy in this file went stale the moment a theme added one, and the preview
 * then rendered with that property resolving to nothing. Reading the real
 * block means the list cannot drift again.
 */
function rootVars(themeLiquid: string, t: ThemeTokens): string {
  const block = themeLiquid.match(/:root\{([\s\S]*?)\n\s*\}/);
  if (!block) {
    // A theme without a recognisable :root still previews, just on the base
    // tokens — better than an empty page.
    return `--brand:${t.brand};--accent:${t.accent};--ink:${t.ink};--bg:${t.bg};--radius:${t.radius}px;--font-heading:${t.headingFont};--font-body:${t.bodyFont};`;
  }
  return block[1]
    .replace(/\{\{\s*settings\.color_brand\s*\}\}/g, t.brand)
    .replace(/\{\{\s*settings\.color_accent\s*\}\}/g, t.accent)
    .replace(/\{\{\s*settings\.color_text\s*\}\}/g, t.ink)
    .replace(/\{\{\s*settings\.color_bg\s*\}\}/g, t.bg)
    .replace(/\{\{\s*settings\.corner_radius\s*\}\}/g, String(t.radius))
    .replace(/--font-heading:[^;]+;/, `--font-heading:${t.headingFont};`)
    .replace(/--font-body:[^;]+;/, `--font-body:${t.bodyFont};`)
    // Any Liquid left over would render as literal text inside the style block.
    .replace(/\{\{[\s\S]*?\}\}/g, "");
}

const CATEGORIES = [
  { title: "Outerwear", count: 24 },
  { title: "Knitwear", count: 18 },
  { title: "Accessories", count: 31 },
];

const PRODUCTS = [
  { title: "The Field Coat", price: "$320.00", soldOut: false },
  { title: "Wool Overshirt", price: "$185.00", soldOut: true },
  { title: "Quilted Liner", price: "$240.00", soldOut: false },
  { title: "Rain Shell", price: "$275.00", soldOut: false },
];

function categoryCards(): string {
  return CATEGORIES.map(
    (c) => `
      <a href="#" class="collection-card" style="border-radius:var(--radius)">
        <span class="collection-card__placeholder"></span>
        <span class="collection-card__title">${escapeHtml(c.title)}<span class="collection-card__count">${c.count} items</span></span>
      </a>`,
  ).join("");
}

function productCards(limit = PRODUCTS.length): string {
  return PRODUCTS.slice(0, limit)
    .map(
      (p) => `
      <a href="#" class="product-card" style="border-radius:var(--radius)">
        <div class="product-card__media">
          <div class="product-card__placeholder"></div>
          ${p.soldOut ? '<span class="badge badge--soldout">Sold out</span>' : ""}
        </div>
        <div class="product-card__body">
          <span class="product-card__title">${escapeHtml(p.title)}</span>
          <span class="product-card__price">${escapeHtml(p.price)}</span>
        </div>
      </a>`,
    )
    .join("");
}

function categoryList(): string {
  const rows = [`<li><a href="#" class="category-list__link">All products <span class="category-list__count">73</span></a></li>`];
  CATEGORIES.forEach((c, i) => {
    rows.push(
      `<li><a href="#" class="category-list__link${i === 0 ? " is-active" : ""}"${i === 0 ? ' aria-current="page"' : ""}>${escapeHtml(c.title)} <span class="category-list__count">${c.count}</span></a></li>`,
    );
  });
  return rows.join("");
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const files = getThemeFiles(id);
  if (!files) return new Response("Unknown theme", { status: 404 });

  const css = files["assets/theme.css"] ?? "";
  const js = files["assets/theme.js"] ?? "";
  const t = themeTokens(id);
  const vars = rootVars(files["layout/theme.liquid"] ?? "", t);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(id)} preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700&family=Lora:wght@400;600&family=Oswald:wght@400;700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>:root{${vars}}</style>
<style>${css}</style>
<style>
  /* Links go nowhere in a preview, so they shouldn't invite a click. The
     controls that genuinely work — thumbnails, quantity, the mobile menu —
     keep their pointer. */
  a{cursor:default}
  button{cursor:pointer}
  /* Labels the sections don't carry themselves, so a merchant scrolling this
     can tell which page each band is showing. */
  .preview-label{max-width:1240px;margin:0 auto;padding:34px 24px 0;font:600 .68rem/1 var(--font-body);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);opacity:.75}
</style>
</head>
<body class="template-index">
  <div class="announcement-bar"><div class="container">Complimentary shipping on orders over $150</div></div>

  <header class="site-header">
    <div class="container site-header__inner">
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Menu">
        <span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span>
      </button>
      <a href="#" class="site-header__logo"><span class="site-header__name">Your Store</span></a>
      <nav class="site-nav" aria-label="Primary">
        <a href="#" class="site-nav__link is-active">Shop</a>
        <div class="site-nav__group">
          <a href="#" class="site-nav__link">Categories<span class="site-nav__caret"></span></a>
          <div class="site-nav__menu">
            ${CATEGORIES.map((c) => `<a href="#" class="site-nav__menu-link">${escapeHtml(c.title)}</a>`).join("")}
          </div>
        </div>
        <a href="#" class="site-nav__link">About</a>
      </nav>
      <div class="site-header__actions">
        <a href="#" class="site-header__icon" aria-label="Search"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 13.5 18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></a>
        <a href="#" class="site-header__cart"><span class="site-header__cart-label">Cart</span> <span class="cart-count">2</span></a>
      </div>
    </div>
  </header>

  <div class="nav-drawer" id="nav-drawer" data-nav-drawer>
    <div class="nav-drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="nav-drawer__head"><span class="nav-drawer__title">Your Store</span>
        <button class="nav-drawer__close" type="button" data-nav-close aria-label="Close menu">&times;</button></div>
      <nav class="nav-drawer__nav">
        <a href="#" class="nav-drawer__link">Shop</a>
        ${CATEGORIES.map((c) => `<a href="#" class="nav-drawer__link nav-drawer__link--child">${escapeHtml(c.title)}</a>`).join("")}
        <a href="#" class="nav-drawer__link">About</a>
      </nav>
    </div>
  </div>

  <section class="hero">
    <div class="container hero__inner">
      <span class="hero__rule" aria-hidden="true"></span>
      <h1 class="hero__heading">Your brand, beautifully built</h1>
      <p class="hero__subheading">Curated products, fast shipping, and a store designed to convert.</p>
      <a href="#" class="btn btn-primary btn-lg">Shop now</a>
    </div>
  </section>

  <p class="preview-label">Home &middot; categories</p>
  <section class="section category-grid">
    <div class="container">
      <div class="section-head"><h2 class="section-title">Shop by category</h2><a href="#" class="link-more">All categories &rarr;</a></div>
      <div class="grid grid-collections">${categoryCards()}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head"><h2 class="section-title">Featured</h2><a href="#" class="link-more">View all &rarr;</a></div>
      <div class="grid grid-products">${productCards()}</div>
    </div>
  </section>

  <p class="preview-label">Category page</p>
  <div class="collection-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#">Home</a><span aria-hidden="true">/</span><a href="#">Categories</a><span aria-hidden="true">/</span><span aria-current="page">Outerwear</span></nav>
      <h1 class="collection-hero__title">Outerwear</h1>
      <div class="rte collection-hero__copy muted">Coats and jackets cut for weather and for wear.</div>
    </div>
  </div>

  <div class="section">
    <div class="container collection-layout">
      <aside class="collection-aside">
        <div class="collection-aside__block">
          <h2 class="collection-aside__title">Categories</h2>
          <ul class="category-list">${categoryList()}</ul>
        </div>
        <!-- No data-filter-form here on purpose: theme.js submits that on
             change, which would navigate the preview iframe away. -->
        <div class="collection-aside__form">
          <div class="collection-aside__block">
            <label class="collection-aside__title" for="p-sort">Sort</label>
            <select id="p-sort" class="field"><option>Featured</option><option>Price, low to high</option><option>Newest</option></select>
          </div>
          <div class="collection-aside__block">
            <h2 class="collection-aside__title">Price</h2>
            <div class="price-filter">
              <label class="price-filter__field"><span class="visually-hidden">Min</span><input type="number" class="field" placeholder="0"></label>
              <span class="price-filter__dash">&ndash;</span>
              <label class="price-filter__field"><span class="visually-hidden">Max</span><input type="number" class="field" placeholder="400"></label>
            </div>
          </div>
          <div class="collection-aside__block">
            <h2 class="collection-aside__title">Availability</h2>
            <ul class="filter-list">
              <li><label class="filter-list__item"><input type="checkbox" checked><span>In stock</span><span class="filter-list__count">19</span></label></li>
              <li><label class="filter-list__item is-empty"><input type="checkbox" disabled><span>Out of stock</span><span class="filter-list__count">5</span></label></li>
            </ul>
          </div>
        </div>
      </aside>

      <div class="collection-main">
        <div class="collection-toolbar"><p class="collection-toolbar__count muted">24 products</p></div>
        <div class="grid grid-products">${productCards()}</div>
        <nav class="pagination" aria-label="Pagination"><span class="is-current">1</span><a href="#">2</a><a href="#">Next</a></nav>
      </div>
    </div>
  </div>

  <p class="preview-label">Product page</p>
  <section class="section">
    <div class="container">
      <div class="product" data-product>
        <div class="product__media">
          <div class="product__media-placeholder" style="border-radius:var(--radius)"></div>
          <div class="product__thumbs">
            <button type="button" class="product__thumb is-active" data-gallery-thumb><span style="display:block;aspect-ratio:1;background:var(--surface)"></span></button>
            <button type="button" class="product__thumb" data-gallery-thumb><span style="display:block;aspect-ratio:1;background:var(--surface)"></span></button>
            <button type="button" class="product__thumb" data-gallery-thumb><span style="display:block;aspect-ratio:1;background:var(--surface)"></span></button>
          </div>
        </div>
        <div class="product__info">
          <p class="product__vendor">Your Store</p>
          <h1 class="product__title">The Field Coat</h1>
          <p class="product__price">$320.00</p>
          <div class="product__options">
            <label class="product__option"><span>Size</span><select><option>Small</option><option>Medium</option><option>Large</option></select></label>
            <label class="product__option"><span>Colour</span><select><option>Olive</option><option>Navy</option></select></label>
          </div>
          <div class="product__buy">
            <div class="qty" data-qty>
              <button type="button" class="qty__step" data-qty-step="-1" aria-label="Decrease quantity">&minus;</button>
              <input type="number" value="1" min="1" aria-label="Quantity">
              <button type="button" class="qty__step" data-qty-step="1" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn btn-primary btn-lg product__add">Add to cart</button>
          </div>
          <div class="rte product__description"><p>A weatherproof cotton shell with a detachable liner, cut for layering.</p></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section value-props">
    <div class="container grid grid-3">
      <div class="value-prop"><h3 class="value-prop__title">Free shipping</h3><p class="muted">On every order over $150, no code needed.</p></div>
      <div class="value-prop"><h3 class="value-prop__title">30-day returns</h3><p class="muted">Changed your mind? Send it back.</p></div>
      <div class="value-prop"><h3 class="value-prop__title">Secure checkout</h3><p class="muted">Every payment protected end to end.</p></div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container site-footer__inner">
      <div><p class="site-footer__name">Your Store</p><p class="muted">Powered by EcomStrait</p></div>
      <nav class="site-footer__nav"><a href="#">Contact</a><a href="#">Shipping</a><a href="#">Returns</a></nav>
    </div>
  </footer>

  <script>${js}</script>
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
