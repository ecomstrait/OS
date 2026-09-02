"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, X } from "lucide-react";
import type { OrderStatus } from "@ecomstrait/db/types";
import { setOrderStatus } from "@/lib/order-actions";
import { ORDER_STATUS_TRANSITIONS, type StatusTransition } from "@/lib/order-status";
import { OrderQuickStatus } from "./order-quick-status";

export type OrderRow = {
  id: string;
  number: number;
  store_name: string | null;
  customer_name: string | null;
  status: OrderStatus;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC", // fixed zone so server- and client-rendered text always match — see hydration note below
});

function itemsSummary(items: OrderRow["order_items"]): string {
  if (items.length === 0) return "—";
  return `${items[0].quantity}× ${items[0].product_name}${items.length > 1 ? ` +${items.length - 1} more` : ""}`;
}

/**
 * The orders list: a selectable table with a per-row status quick-change and
 * a bulk action bar, instead of the plain list of link-rows this replaced.
 *
 * Selection and bulk actions live here (client) while the data fetch, auth,
 * search, and pagination stay in `page.tsx` (server) — this component only
 * ever receives the current page's rows.
 */
export function OrdersList({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const byId = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const selectedRows = useMemo(
    () => [...selected].map((id) => byId.get(id)).filter((o): o is OrderRow => Boolean(o)),
    [selected, byId],
  );

  // Only offer a bulk move every selected order can actually make — mixing a
  // processing order and a shipped order in one selection should narrow the
  // choices, never suggest a move that would silently no-op on one of them.
  const commonMoves = useMemo<StatusTransition[]>(() => {
    if (selectedRows.length === 0) return [];
    const [first, ...rest] = selectedRows.map((o) => ORDER_STATUS_TRANSITIONS[o.status]);
    return first.filter((move) => rest.every((moves) => moves.some((m) => m.to === move.to)));
  }, [selectedRows]);

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(to: OrderStatus) {
    setBulkError(null);
    const ids = [...selected];
    start(async () => {
      const results = await Promise.all(ids.map((id) => setOrderStatus(id, to)));
      const failed = results.filter((r) => r?.error).length;
      if (failed > 0) {
        setBulkError(
          failed === ids.length
            ? "That didn't go through for any of the selected orders."
            : `Updated ${ids.length - failed} of ${ids.length} — ${failed} failed.`,
        );
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ai-200 bg-ai-50/60 px-4 py-3">
          <p className="text-sm font-semibold text-ink-800">
            {selected.size} order{selected.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {commonMoves.length === 0 ? (
              <p className="text-sm text-ink-500">
                Select orders that are all at the same stage to update them together.
              </p>
            ) : (
              commonMoves.map((move) => {
                const tones = {
                  brand: "bg-brand-500 text-white hover:bg-brand-600",
                  red: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
                } as const;
                return (
                  <button
                    key={move.to}
                    onClick={() => runBulk(move.to)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${tones[move.tone]}`}
                  >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <move.icon className="h-3.5 w-3.5" />}
                    {move.label}
                  </button>
                );
              })
            )}
          </div>
          {bulkError && <p className="text-xs text-red-600">{bulkError}</p>}
          <button
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center gap-4 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all orders on this page"
            className="h-4 w-4 shrink-0 rounded border-ink-300 text-ai-600 focus:ring-ai-400"
          />
          <span className="min-w-0 flex-1">Order</span>
          <span className="w-40 shrink-0">Status</span>
          <span className="w-4 shrink-0" />
        </div>

        {orders.map((o) => {
          const items = o.order_items ?? [];
          return (
            <div
              key={o.id}
              className="flex items-center gap-4 border-b border-ink-50 px-4 py-3 transition last:border-0 hover:bg-ink-50/50"
            >
              <input
                type="checkbox"
                checked={selected.has(o.id)}
                onChange={() => toggleOne(o.id)}
                aria-label={`Select order #${o.number}`}
                className="h-4 w-4 shrink-0 rounded border-ink-300 text-ai-600 focus:ring-ai-400"
              />
              <Link href={`/orders/${o.id}`} className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">
                  #{o.number} · {o.store_name || o.customer_name || "Customer"}
                </p>
                <p className="truncate text-sm text-ink-500">
                  {itemsSummary(items)} <span className="text-ink-300">· {dateFormatter.format(new Date(o.created_at))}</span>
                </p>
              </Link>
              <div className="w-40 shrink-0">
                <OrderQuickStatus orderId={o.id} status={o.status} />
              </div>
              <Link
                href={`/orders/${o.id}`}
                aria-label={`View order #${o.number}`}
                className="shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-ink-600"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
