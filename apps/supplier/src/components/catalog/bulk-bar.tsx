"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Package, Trash2, X } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { BulkResult } from "@/lib/bulk";

type Props = {
  count: number;
  pending: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onSetStock: (stock: number) => void;
  onAdjustStock: (delta: number) => void;
  onDelete: () => void;
  onClear: () => void;
  result: BulkResult | null;
};

type StockMode = "set" | "adjust";

/**
 * Floating action bar for the catalog table. Only rendered while at least one
 * row is selected; the stock panel is collapsed until asked for so the bar
 * stays readable on narrow screens.
 */
export function BulkBar({
  count,
  pending,
  onPublish,
  onUnpublish,
  onSetStock,
  onAdjustStock,
  onDelete,
  onClear,
  result,
}: Props) {
  const [stockOpen, setStockOpen] = useState(false);
  const [mode, setMode] = useState<StockMode>("set");
  const [value, setValue] = useState("");

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(parsed) && (mode === "set" ? parsed >= 0 : parsed !== 0);

  function apply() {
    if (!valid) return;
    if (mode === "set") onSetStock(parsed);
    else onAdjustStock(parsed);
    setValue("");
    setStockOpen(false);
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="sticky bottom-4 z-20 mt-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-ink-200 bg-white p-3 shadow-lg shadow-ink-900/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-ink-900">
            {count} selected
          </span>

          <button onClick={onPublish} disabled={pending} className={cn(btn, "text-ink-700 hover:bg-ink-100")}>
            <Eye className="h-4 w-4" /> Publish
          </button>
          <button onClick={onUnpublish} disabled={pending} className={cn(btn, "text-ink-700 hover:bg-ink-100")}>
            <EyeOff className="h-4 w-4" /> Unpublish
          </button>
          <button
            onClick={() => setStockOpen((o) => !o)}
            disabled={pending}
            aria-expanded={stockOpen}
            className={cn(btn, stockOpen ? "bg-ink-100 text-ink-900" : "text-ink-700 hover:bg-ink-100")}
          >
            <Package className="h-4 w-4" /> Stock
          </button>
          <button onClick={onDelete} disabled={pending} className={cn(btn, "text-red-600 hover:bg-red-50")}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>

          <div className="ml-auto flex items-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
            <button
              onClick={onClear}
              disabled={pending}
              aria-label="Clear selection"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {stockOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <div className="flex rounded-lg border border-ink-200 p-0.5">
              {(["set", "adjust"] as StockMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    mode === m ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50",
                  )}
                >
                  {m === "set" ? "Set to" : "Adjust by"}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={value}
              min={mode === "set" ? 0 : undefined}
              step={1}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={mode === "set" ? "0" : "-5"}
              aria-label={mode === "set" ? "New stock level" : "Change stock by"}
              className="h-9 w-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={apply}
              disabled={pending || !valid}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Apply to {count}
            </button>
            <span className="text-xs text-ink-400">
              {mode === "set"
                ? "Every selected product is set to this level."
                : "Added to each product's current stock; never goes below zero."}
            </span>
          </div>
        )}

        {result && (
          <p
            role="status"
            className={cn("mt-2 text-xs", result.error ? "text-red-600" : "text-ink-500")}
          >
            {result.error
              ? result.error
              : result.affected === 0
                ? "No products changed."
                : `${result.affected} product${result.affected === 1 ? "" : "s"} updated.`}
          </p>
        )}
      </div>
    </div>
  );
}
