"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, KeyRound, X } from "lucide-react";
import { markStoreTransferred, cancelStoreTransfer } from "@/lib/admin-actions";

/**
 * Completes the handover an admin performed in Shopify.
 *
 * Marking transferred is one-way — the store leaves our pool permanently — so
 * it asks for confirmation rather than firing on a single click.
 */
export function TransferControl({
  shopifyStoreId,
  transferEmail,
  status,
}: {
  shopifyStoreId: string;
  transferEmail: string | null;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "transferred") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-400">
        <Check className="h-3.5 w-3.5" /> Handed over
      </span>
    );
  }
  if (!transferEmail) return null;

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-500">Transferred in Shopify?</span>
          <button
            onClick={() => run(() => markStoreTransferred(shopifyStoreId))}
            disabled={pending}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-500 px-2.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Yes, done
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            aria-label="Cancel"
            className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-ink-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          <KeyRound className="h-3 w-3" /> Mark transferred
        </button>
        <button
          onClick={() => run(() => cancelStoreTransfer(shopifyStoreId))}
          disabled={pending}
          title="Cancel this transfer request"
          className="text-xs font-medium text-ink-400 hover:text-ink-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
