"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { resyncShopifyTheme } from "@/lib/shopify-actions";

/** Push the store's current EcomAI plan (colors/hero/logo) to the live Shopify theme. */
export function ResyncButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function run() {
    setError(null);
    setDone(false);
    start(async () => {
      const res = await resyncShopifyTheme(storeId);
      if (res.error) setError(res.error);
      else {
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <span className="flex items-center gap-2">
      {error && (
        <span className="max-w-[16rem] truncate text-xs text-red-500" title={error}>
          {error}
        </span>
      )}
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
        title="Push your latest EcomAI edits (colors, hero, logo) to the live Shopify store"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : done ? (
          <Check className="h-3.5 w-3.5 text-brand-600" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Update live store
      </button>
    </span>
  );
}
