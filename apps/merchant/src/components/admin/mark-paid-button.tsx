"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { markSettlementBatchPaid } from "@/lib/settlement-actions";

export function MarkPaidButton({ batchId }: { batchId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await markSettlementBatchPaid(batchId); })}
      className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Mark paid
    </button>
  );
}
