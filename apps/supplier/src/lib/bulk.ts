/**
 * Helpers for the catalog bulk actions. Kept out of the "use server" modules,
 * which may only export async functions.
 */

/** Max ids per `.in(...)` filter — keeps PostgREST URLs well under length limits. */
export const BULK_CHUNK = 200;

/** Split a list into fixed-size chunks. */
export function chunk<T>(items: T[], size = BULK_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** De-duplicate and drop empty ids before they reach a query. */
export function cleanIds(ids: string[]): string[] {
  return [...new Set(ids)].filter((id) => typeof id === "string" && id.length > 0);
}

export type BulkResult = { affected: number; error?: string };
