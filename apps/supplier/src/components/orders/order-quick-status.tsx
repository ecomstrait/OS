"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@ecomstrait/db/types";
import { setOrderStatus } from "@/lib/order-actions";
import { ORDER_STATUS_DOT, ORDER_STATUS_LABEL, ORDER_STATUS_TRANSITIONS } from "@/lib/order-status";

/**
 * Change one order's status right from the list, without opening its detail
 * page. Only ever offers the same forward moves `OrderStatusActions` does
 * (both read `ORDER_STATUS_TRANSITIONS`) — a merchant can't accidentally
 * send a delivered order back to processing from here.
 *
 * A plain sibling element in its row, not nested inside the row's own link —
 * a `<select>` inside an `<a>` would fight that link for every click.
 */
export function OrderQuickStatus({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = ORDER_STATUS_TRANSITIONS[status];

  // Nothing further to do from here — a live dropdown with no real choices
  // reads as broken, so show the same plain label the detail page falls
  // back to instead.
  if (next.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <span className={`h-1.5 w-1.5 rounded-full ${ORDER_STATUS_DOT[status]}`} />
        {ORDER_STATUS_LABEL[status]}
      </span>
    );
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const to = e.target.value as OrderStatus;
    if (to === status) return;
    setError(null);
    start(async () => {
      const res = await setOrderStatus(orderId, to);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ink-400" />
      ) : (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ORDER_STATUS_DOT[status]}`} />
      )}
      <select
        value={status}
        disabled={pending}
        onChange={onChange}
        title={error ?? "Change status"}
        aria-label={`Status for order — currently ${ORDER_STATUS_LABEL[status]}`}
        className={`h-8 rounded-lg border bg-white px-2 text-xs font-semibold outline-none focus:border-ai-400 disabled:opacity-50 ${
          error ? "border-red-300 text-red-600" : "border-ink-200 text-ink-700"
        }`}
      >
        <option value={status}>{ORDER_STATUS_LABEL[status]}</option>
        {next.map((t) => (
          <option key={t.to} value={t.to}>
            → {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
