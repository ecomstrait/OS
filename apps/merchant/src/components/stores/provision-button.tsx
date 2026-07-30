"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { provisionShopifyStore } from "@/lib/shopify-actions";

export function ProvisionButton({ storeId, label }: { storeId: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    start(async () => {
      const res = await provisionShopifyStore(storeId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-2">
      {/* Provisioning errors are long and specific (theme URL, scopes, tokens) —
          keep the full text in the tooltip rather than losing it. */}
      {error && <span className="max-w-[20rem] truncate text-xs text-red-500" title={error}>{error}</span>}
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Store className="h-3.5 w-3.5" />}
        {label ?? "Provision on Shopify"}
      </button>
    </span>
  );
}
