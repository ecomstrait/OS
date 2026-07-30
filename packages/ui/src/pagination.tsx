import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageCount, type RawParams } from "./table-params";

type Props = {
  /** Route to link to, e.g. "/catalog". */
  basePath: string;
  /** The page's current searchParams, so `q` (and anything else) survives paging. */
  params: RawParams;
  page: number;
  total: number;
  size: number;
};

function hrefFor(basePath: string, params: RawParams, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value == null) continue;
    next.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
  }
  if (page > 1) next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Prev/next pager. Renders nothing for a single page — a server component, so
 * paging works without client JS.
 */
export function Pagination({ basePath, params, page, total, size }: Props) {
  const pages = pageCount(total, size);
  if (pages <= 1) return null;

  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);
  const link =
    "inline-flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50";
  const disabled = "inline-flex items-center gap-1 rounded-lg border border-ink-100 px-3 py-2 text-sm font-semibold text-ink-300";

  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-ink-500">
        {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(basePath, params, page - 1)} className={link} rel="prev">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            <ChevronLeft className="h-4 w-4" /> Previous
          </span>
        )}
        <span className="text-sm text-ink-500">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link href={hrefFor(basePath, params, page + 1)} className={link} rel="next">
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            Next <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
