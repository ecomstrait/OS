"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { discardDraft } from "@/lib/builder-actions";

/**
 * Throw away an unlaunched draft from the stores list.
 *
 * No type-the-name confirmation, unlike `DeleteStoreButton`. That guard exists
 * because deleting a live store destroys orders and releases a Shopify shop; a
 * draft has never been public, has no orders, and expires on its own in a few
 * days anyway. Making it ceremonious would misrepresent what's at stake.
 */
export function DiscardDraftButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await discardDraft(storeId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={run}
        disabled={busy}
        title="Discard this draft"
        aria-label="Discard this draft"
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}
