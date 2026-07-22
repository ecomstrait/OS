"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Repeat2, Loader2 } from "lucide-react";
import type { RequestStatus } from "@ecomstrait/db/types";
import { setRequestStatus } from "@/lib/request-actions";

const ACTIONS: Record<
  RequestStatus,
  { to: RequestStatus; label: string; icon: typeof Check; tone: "brand" | "red" | "ink" }[]
> = {
  new: [
    { to: "accepted", label: "Accept & create order", icon: Check, tone: "brand" },
    { to: "proposed", label: "Propose alternative", icon: Repeat2, tone: "ink" },
    { to: "declined", label: "Decline", icon: X, tone: "red" },
  ],
  proposed: [
    { to: "accepted", label: "Accept & create order", icon: Check, tone: "brand" },
    { to: "declined", label: "Decline", icon: X, tone: "red" },
  ],
  // Accepting converts the request into an Order (managed under Orders).
  accepted: [],
  declined: [{ to: "new", label: "Reopen", icon: Repeat2, tone: "ink" }],
  fulfilled: [],
};

export function RequestStatusActions({
  requestId,
  status,
}: {
  requestId: string;
  status: RequestStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS[status];
  if (actions.length === 0) {
    return <p className="text-sm text-ink-400">This request is closed.</p>;
  }

  function run(to: RequestStatus) {
    setError(null);
    start(async () => {
      const res = await setRequestStatus(requestId, to);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  const tones = {
    brand: "bg-brand-500 text-white hover:bg-brand-600",
    red: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
    ink: "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
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
