"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ImageOff, Loader2, Search, X } from "lucide-react";
import type { PreviewProduct } from "@/lib/builder-actions";
import { searchStoreProductsForPicker } from "@/lib/builder-actions";

/**
 * Pick from the store's own approved+published products — the picker behind
 * a "products" section (e.g. "Best sellers").
 *
 * Mounts its fetch on open, same as MediaPicker, and re-fetches as the
 * merchant searches. Toggling a product fires `onChange` immediately with
 * the full updated id list rather than buffering a "Done" click — there's
 * nothing to lose by closing the picker mid-search.
 */

type PickerProps = {
  storeId: string;
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onChange: (ids: string[]) => void;
  /** Streams fetched product data back up so the section can show real
   *  titles/thumbnails for its picks without re-fetching them itself. */
  onResults?: (products: PreviewProduct[]) => void;
};

export function ProductPicker(props: PickerProps) {
  if (!props.open) return null;
  return <Picker {...props} />;
}

function Picker({ storeId, selectedIds, onClose, onChange, onResults }: PickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PreviewProduct[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => {
      start(async () => {
        const products = await searchStoreProductsForPicker(storeId, query);
        setResults(products);
        onResults?.(products);
      });
    }, query ? 250 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, query]);

  const selected = new Set(selectedIds);
  function toggle(id: string) {
    onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-950">Choose products</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-ink-500 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products…"
            className="h-9 w-full rounded-lg border border-ink-200 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {pending && results.length === 0 && (
            <div className="grid place-items-center py-10 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!pending && results.length === 0 && (
            <p className="py-10 text-center text-xs text-ink-500">
              {query ? "No products match." : "Nothing listed on this store yet."}
            </p>
          )}
          {results.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-ink-50"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-ink-300">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-900">{p.title}</p>
                  {p.price != null && <p className="text-xs text-ink-400">${p.price}</p>}
                </div>
                <div
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="text-xs text-ink-500">{selectedIds.length} selected</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
