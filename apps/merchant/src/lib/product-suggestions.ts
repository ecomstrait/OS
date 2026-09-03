import "server-only";
import { getPlatformTopSellers, getPublishedCatalog, economicsFor, type CatalogProduct } from "@/lib/catalog";

export type ProductSuggestion = CatalogProduct & {
  unitsSold: number;
  marginPct: number | null;
  reason: string;
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
}): Promise<ProductSuggestion[]> {
  const limit = opts.limit ?? 5;
  const exclude = new Set(opts.excludeIds ?? []);
  const category = opts.category?.trim() || undefined;

  const pool = (await getPlatformTopSellers({ category, limit: limit * 4 })).filter((p) => !exclude.has(p.id));

  // A niche too new to have its own platform sales history yet falls back
  // to the published catalog itself, ranked by margin alone — better than
  // an empty suggestion list for exactly the merchant who needs this most.
  if (pool.length < limit) {
    const { products } = await getPublishedCatalog({ category }, { from: 0, to: 60 });
    const seen = new Set(pool.map((p) => p.id));
    for (const p of products) {
      if (exclude.has(p.id) || seen.has(p.id)) continue;
      pool.push({ ...p, unitsSold: 0 });
    }
  }

  // A freeform niche phrase pulled from conversation ("women's garments")
  // is not the same string a product's own `category` column holds — an
  // exact-match filter on that is likely to match NOTHING, not just "not
  // much" (confirmed: a real merchant asking about "women's garments" got
  // zero suggestions back even though the platform has real sales). An
  // empty result here reads as "nothing sells on this whole platform,"
  // which is never true — fall back to genuinely platform-wide results
  // with no category filter at all rather than show nothing.
  if (pool.length === 0 && category) {
    return suggestProductsForStore({ excludeIds: opts.excludeIds, limit });
  }

  return pool
    .map((p) => {
      const marginPct = economicsFor(p).marginPct;
      return { ...p, marginPct, reason: reasonFor(p.unitsSold, marginPct) };
    })
    .sort((a, b) => scoreFor(b) - scoreFor(a))
    .slice(0, limit);
}
