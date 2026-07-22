"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, Undo2 } from "lucide-react";
import type { SupplierStatus } from "@ecomstrait/db/types";
import { approveSupplier, rejectSupplier, returnToPending } from "@/lib/admin-actions";

export function AdminActions({ id, status }: { id: string; status: SupplierStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run(() => approveSupplier(id))}
          disabled={pending || status === "approved"}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </button>
        <button
          onClick={() => run(() => rejectSupplier(id))}
          disabled={pending || status === "rejected"}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => run(() => returnToPending(id))}
          disabled={pending || status === "pending"}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4" /> Return for edits
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
