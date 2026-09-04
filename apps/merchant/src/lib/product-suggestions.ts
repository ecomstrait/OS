import "server-only";
import { getPlatformTopSellers, getPublishedCatalog, economicsFor, type CatalogProduct } from "@/lib/catalog";

export type ProductSuggestion = CatalogProduct & {
  unitsSold: number;
  marginPct: number | null;
  reason: string;
};

export type ProductSuggestionResult = {
  products: ProductSuggestion[];
  /**
   * True only when a category was actually requested AND real products in
   * that category were found. False either when no category was requested
   * at all, or — this is the case a caller needs to handle honestly — a
   * category WAS requested but matched nothing, so `products` fell back to
   * genuine platform-wide results instead. A caller must never present that
   * fallback as if it answered the specific category asked for.
   */
  matchedCategory: boolean;
  /** Whatever category was asked for (trimmed), even when `matchedCategory`
   *  is false — so a caller can name it in an honest fallback message. */
  requestedCategory: string | null;
};

function scoreFor(p: { unitsSold: number; marginPct: number | null }): number {
  // Units sold dominates — platform sales signal is the whole point of this
  // (a pre-launch store has none of its own), margin breaks ties.
  return p.unitsSold * 2 + (p.marginPct ?? 0);
}

function reasonFor(unitsSold: number, marginPct: number | null): string {
  const parts: string[] = [];
  if (unitsSold > 0) parts.push(`${unitsSold} sold across the platform recently`);
  if (marginPct != null) parts.push(`~${marginPct}% margin`);
  return parts.join(", ") || "published and in stock";
}

function rank(pool: (CatalogProduct & { unitsSold: number })[], limit: number): ProductSuggestion[] {
  return pool
    .map((p) => {
      const marginPct = economicsFor(p).marginPct;
      return { ...p, marginPct, reason: reasonFor(p.unitsSold, marginPct) };
    })
    .sort((a, b) => scoreFor(b) - scoreFor(a))
    .slice(0, limit);
}

/**
 * Recommend products for a store to add — the data side of the builder
 * chat's "suggest_products" intent (ecomai.ts classifies the request;
 * builder-actions.ts calls this and presents the result). Deterministic
 * ranking, no LLM involved in the ranking itself — same split as the
 * Analytics Agent (SQL for facts, the model only narrates).
 */
export async function suggestProductsForStore(opts: {
  category?: string | null;
  excludeIds?: string[];
  limit?: number;
}): Promise<ProductSuggestionResult> {
  const limit = opts.limit ?? 5;
  const exclude = new Set(opts.excludeIds ?? []);
  const category = opts.category?.trim() || undefined;

  const pool = (await getPlatformTopSellers({ category, limit: limit * 4 })).filter((p) => !exclude.has(p.id));

  // A niche too new to have its own platform sales history yet falls back
  // to the published catalog itself, ranked by margin alone — better than
  // an empty suggestion list for exactly the merchant who needs this most.
  // `categoryMatch: "ilike"` matters here specifically: this category is a
  // freeform phrase out of an AI conversation ("smartphones"), never
  // guaranteed to match the DB's own casing ("Smartphones") on an exact
  // filter — see catalog.ts's own note on this.
  if (pool.length < limit) {
    const { products } = await getPublishedCatalog({ category, categoryMatch: "ilike" }, { from: 0, to: 60 });
    const seen = new Set(pool.map((p) => p.id));
    for (const p of products) {
      if (exclude.has(p.id) || seen.has(p.id)) continue;
      pool.push({ ...p, unitsSold: 0 });
    }
  }

  // A category that was actually asked for and matched real products, even
  // if fewer than `limit` — still a genuine match, not a fallback.
  if (pool.length > 0 || !category) {
    return { products: rank(pool, limit), matchedCategory: Boolean(category) && pool.length > 0, requestedCategory: category ?? null };
  }

  // Nothing at all for the requested category (case-insensitively, across
  // both tiers above) — genuinely platform-wide results are still more
  // useful than an empty list, but the caller MUST be told this is a
  // fallback, not a match, so it can say so honestly rather than presenting
  // unrelated products as if they were what was asked for. A real bug this
  // fixed: a merchant who pivoted to "smartphones" (no published stock at
  // all — real, not a matching bug) got shoes back with no indication they
  // weren't smartphones at all.
  const fallback = await suggestProductsForStore({ excludeIds: opts.excludeIds, limit });
  return { products: fallback.products, matchedCategory: false, requestedCategory: category ?? null };
}
