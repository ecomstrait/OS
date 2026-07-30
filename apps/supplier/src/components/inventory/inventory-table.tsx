"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, Check } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { batchSetStock, setThreshold } from "@/lib/inventory-actions";

export type InventoryRow = {
  id: string;
  title: string;
  stock: number;
  reserved: number;
  low_stock_threshold: number;
};

type Edit = { stock: number; threshold: number };

export function stockStatus(available: number, threshold: number) {
  if (available <= 0) return { label: "Out of stock", cls: "bg-red-50 text-red-600" };
  if (available <= threshold) return { label: "Low stock", cls: "bg-amber-50 text-amber-700" };
  return { label: "In stock", cls: "bg-brand-50 text-brand-700" };
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [lowOnly, setLowOnly] = useState(false);

  const original = useMemo(() => {
    const m: Record<string, Edit> = {};
    rows.forEach((r) => (m[r.id] = { stock: r.stock, threshold: r.low_stock_threshold }));
    return m;
  }, [rows]);

  const [edits, setEdits] = useState<Record<string, Edit>>(original);

  function update(id: string, patch: Partial<Edit>) {
    setSaved(false);
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  }

  const dirty = useMemo(
    () =>
      rows.filter((r) => {
        const e = edits[r.id];
        return e && (e.stock !== original[r.id].stock || e.threshold !== original[r.id].threshold);
      }),
    [rows, edits, original],
  );

  function save() {
    start(async () => {
      const stockChanges = dirty
        .filter((r) => edits[r.id].stock !== original[r.id].stock)
        .map((r) => ({ id: r.id, stock: edits[r.id].stock }));
      const thresholdChanges = dirty.filter(
        (r) => edits[r.id].threshold !== original[r.id].threshold,
      );

      if (stockChanges.length) await batchSetStock(stockChanges);
      for (const r of thresholdChanges) await setThreshold(r.id, edits[r.id].threshold);

      setSaved(true);
      router.refresh();
    });
  }

  const visible = rows.filter((r) => {
    if (!lowOnly) return true;
    const e = edits[r.id];
    return e.stock - r.reserved <= e.threshold;
  });

  return (
    <div className="flex flex-col gap-3">
      {dirty.length > 0 && (
        <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {dirty.length} unsaved change{dirty.length === 1 ? "" : "s"} on this page — save before
          searching or changing page.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500"
          />
          Low / out of stock only
        </label>
        <button
          onClick={save}
          disabled={pending || dirty.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved && dirty.length === 0 ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : (
            `Save changes${dirty.length ? ` (${dirty.length})` : ""}`
          )}
        </button>
      </div>

      <div className={cn("overflow-x-auto rounded-2xl border border-ink-100 bg-white", pending && "opacity-70")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Reserved</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Low-stock at</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const e = edits[r.id];
              const available = e.stock - r.reserved;
              const st = stockStatus(available, e.threshold);
              return (
                <tr key={r.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{r.title}</td>
                  <td className="px-4 py-3 text-ink-700">{available}</td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{r.reserved}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Decrease"
                        onClick={() => update(r.id, { stock: Math.max(0, e.stock - 1) })}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={e.stock}
                        onChange={(ev) => update(r.id, { stock: Math.max(0, Number(ev.target.value)) })}
                        className="h-8 w-16 rounded-lg border border-ink-200 px-2 text-center text-sm outline-none focus:border-brand-400"
                      />
                      <button
                        aria-label="Increase"
                        onClick={() => update(r.id, { stock: e.stock + 1 })}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <input
                      type="number"
                      min={0}
                      value={e.threshold}
                      onChange={(ev) => update(r.id, { threshold: Math.max(0, Number(ev.target.value)) })}
                      className="h-8 w-16 rounded-lg border border-ink-200 px-2 text-center text-sm outline-none focus:border-brand-400"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
