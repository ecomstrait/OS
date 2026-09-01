/**
 * Category constants/helpers shared between the server-only storefront data
 * layer (`storefront-api.ts`, which imports `next/headers` and the admin DB
 * client) and client storefront components.
 *
 * This file has zero imports on purpose: a client component importing
 * `categoryLabel` straight from `storefront-api.ts` would pull that entire
 * server module into the browser bundle and fail the build (the same class
 * of bug as the `ask-ecomai.tsx` / `@ecomstrait/ai` build break). Keeping
 * these here means both sides import the one real definition instead of
 * drifting into two copies.
 */

/** Sentinel category id for products with no `category` set — never hidden from the storefront, just grouped on its own. */
export const UNCATEGORIZED = "__uncategorized__";

/** The category label shown to customers — `UNCATEGORIZED` is a real query value, never a display string. */
export function categoryLabel(category: string): string {
  return category === UNCATEGORIZED ? "More" : category;
}
