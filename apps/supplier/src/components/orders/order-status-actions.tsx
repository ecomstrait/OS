"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@ecomstrait/db/types";
import { setOrderStatus } from "@/lib/order-actions";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/order-status";

export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = ORDER_STATUS_TRANSITIONS[status];
  if (actions.length === 0) {
    return <p className="text-sm text-ink-400">This order is {status}.</p>;
  }

  function run(to: OrderStatus) {
    setError(null);
    start(async () => {
      const res = await setOrderStatus(orderId, to);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  const tones = {
    brand: "bg-brand-500 text-white hover:bg-brand-600",
    red: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  } as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.to}
            onClick={() => run(a.to)}
            disabled={pending}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${tones[a.tone]}`}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <a.icon className="h-4 w-4" />}
            {a.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
