/**
 * Shared parsing for the `?q=` / `?page=` table params used across the portal.
 * Plain module (no "use server") so both server pages and client components
 * can import from it.
 */

export const PAGE_SIZE = 20;

/** Raw Next.js searchParams shape. */
export type RawParams = Record<string, string | string[] | undefined>;

export type TableQuery = {
  /** Sanitised search term ("" when absent). */
  q: string;
  /** 1-based page number. */
  page: number;
  /** Inclusive row offsets for Supabase `.range(from, to)`. */
  from: number;
  to: number;
  size: number;
};

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

/**
 * Strip characters that would break a PostgREST filter string. Commas separate
 * conditions inside `.or(...)` and parentheses group them, so a raw term
 * containing them would change the query's meaning rather than be matched.
 * `%` and `*` are wildcards; `_` is left alone so SKUs like `AB_12` still work.
 */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()\\%*]/g, " ").trim().slice(0, 80);
}

/** Wrap a sanitised term for an `ilike` filter. */
export function likeTerm(q: string): string {
  return `%${q}%`;
}

export function parseTableParams(params: RawParams, size = PAGE_SIZE): TableQuery {
  const q = sanitizeSearch(first(params.q));
  const rawPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const from = (page - 1) * size;
  return { q, page, from, to: from + size - 1, size };
}

/** Total pages for a row count (at least 1, so the UI never shows "of 0"). */
export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * Clamp a requested page to what actually exists. Guards the case where someone
 * lands on `?page=9` after the result set shrank.
 */
export function clampPage(page: number, total: number, size = PAGE_SIZE): number {
  return Math.min(Math.max(1, page), pageCount(total, size));
}

/** Slice an in-memory list for the current page (used where SQL can't paginate). */
export function pageSlice<T>(rows: T[], page: number, size = PAGE_SIZE): T[] {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}
