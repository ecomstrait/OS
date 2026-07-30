"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type Props = {
  /** Placeholder describing what's searchable, e.g. "Search products, SKU…". */
  placeholder: string;
  /** Rendered on the right, typically the "1–20 of 84" summary. */
  summary?: string;
};

/**
 * URL-driven search box. Writes `?q=` (debounced) and drops `?page=` so a new
 * term always lands on page 1. Other params are preserved.
 */
export function SearchBar({ placeholder, summary }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("q") ?? "";

  const [value, setValue] = useState(current);
  const mounted = useRef(false);

  useEffect(() => {
    // Skip the first run so simply rendering the page doesn't navigate.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const term = value.trim();
      if (term) next.set("q", term);
      else next.delete("q");
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [value, params, pathname, router]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-brand-400"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-400 hover:bg-ink-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {summary && <p className="text-sm text-ink-500">{summary}</p>}
    </div>
  );
}
