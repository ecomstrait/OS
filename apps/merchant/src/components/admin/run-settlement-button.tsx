"use client";

import { useState, useTransition } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { runSettlementNow } from "@/lib/settlement-actions";

/**
 * Manual trigger for the weekly settlement batch — same logic the
 * `/api/cron/settlement` schedule runs (see `apps/merchant/vercel.json`),
 * for right after releasing a hold or whenever an admin wants to settle on
 * demand instead of waiting for the next scheduled run.
 */
export function RunSettlementButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await runSettlementNow();
            setResult(res.error ?? (res.count ? `Settled ${res.count} payable(s).` : "Nothing pending to settle."));
          })
        }
        className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
        Run settlement now
      </button>
      {result && <span className="text-xs text-ink-500">{result}</span>}
    </div>
  );
}
