"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus } from "lucide-react";
import { syncProductsToShopify } from "@/lib/shopify-actions";

/**
 * Push approved listings into an already-provisioned Shopify store.
 *
 * Safe to press repeatedly — the action skips products already in the shop.
 */
export function SyncProductsButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function run() {
    setMessage(null);
    start(async () => {
      const res = await syncProductsToShopify(storeId);
      setIsError(Boolean(res.error));
      setMessage(res.error ?? res.note ?? null);
      if (!res.error) router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-2">
      {message && (
        <span
          title={message}
          className={`max-w-[18rem] truncate text-xs ${isError ? "text-red-500" : "text-ink-500"}`}
        >
          {message}
        </span>
      )}
      <button
        onClick={run}
        disabled={pending}
        title="Push approved products to this Shopify store"
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackagePlus className="h-3.5 w-3.5" />}
        Sync products
      </button>
    </span>
  );
}
