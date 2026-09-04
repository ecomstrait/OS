import type { Storefront } from "@/lib/storefront";
import type { ApiProduct, StorefrontNavLink } from "@/lib/storefront-api";
import type { CategoryBand } from "@/components/storefront/storefront-view";
import type { PageDetail } from "@/lib/pages-api";
import type { PostDetail } from "@/lib/blog-api";

/**
 * Message-type constants shared between the Store Builder
 * (components/builder/store-builder.tsx, both the embedded <iframe> and the
 * "Live Preview" new-tab button) and the page it talks to
 * (app/builder-preview-frame/page.tsx). Kept in one place so the two sides
 * can't drift — a typo'd string literal on either end would otherwise fail
 * silently (a postMessage nobody's listening for), not with a type error.
 */
export const BUILDER_PREVIEW_READY = "ecomstrait:builder-preview:ready";
export const BUILDER_PREVIEW_DATA = "ecomstrait:builder-preview:data";

/**
 * The full payload sent on every `BUILDER_PREVIEW_DATA` message — previously
 * declared as two separate, hand-synced local `Payload` types (one in
 * store-builder.tsx building it, one in builder-preview-frame/page.tsx
 * consuming it). Centralized here so the two sides can't quietly drift the
 * way blog posts and custom pages already had (built on one side, never
 * read on the other, for a while).
 */
export type BuilderPreviewPayload = {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categoryBands: CategoryBand[];
  /** Custom pages (Contact Us, FAQ, ...) created through the EcomAI chat —
   *  full body included, since this preview has no server round-trip to
   *  fetch one on demand when a merchant opens it. */
  pages: PageDetail[];
  /** Published blog posts — written from the store's own Blog screen, not
   *  this chat, so this only ever reflects what existed when the builder
   *  session loaded. Full body included, same reasoning as `pages`. */
  posts: PostDetail[];
  /** `type: "products"` plan sections (e.g. "Best sellers") resolved to
   *  live product data, keyed by section id — same shape `StorefrontView`
   *  already expects on the real, live site (storefront-pages.tsx). */
  productsBySection: Record<string, ApiProduct[]>;
};
