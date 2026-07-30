"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  MoreHorizontal,
  PackagePlus,
  RefreshCw,
  Sparkles,
  Store,
} from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { provisionShopifyStore, resyncShopifyTheme, syncProductsToShopify } from "@/lib/shopify-actions";
import { DeleteStoreButton } from "@/components/stores/delete-store-button";
import { MakeItYoursButton } from "@/components/stores/make-it-yours-button";

type Props = {
  storeId: string;
  storeName: string;
  /** Shopify-path store that hasn't finished provisioning. */
  needsProvision: boolean;
  /** Already claimed a shop, so provisioning would be a retry. */
  isLinked: boolean;
  hasShopify: boolean;
  isLiquidTheme: boolean;
  hasOrders: boolean;
  referralUrl: string;
  transferEmail: string | null;
  transferred: boolean;
};

/**
 * One Actions menu per store row.
 *
 * These actions accumulated as separate buttons until a row was a wall of
 * controls. Grouping them keeps the row readable and leaves the status badge
 * and storefront link — the things merchants scan for — visible.
 */
export function StoreActions({
  storeId,
  storeName,
  needsProvision,
  isLinked,
  hasShopify,
  isLiquidTheme,
  hasOrders,
  referralUrl,
  transferEmail,
  transferred,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  /** Run an action, keep its outcome on the row, and close the menu. */
  function run(key: string, fn: () => Promise<{ error?: string; note?: string; ok?: boolean }>) {
    setRunning(key);
    setMessage(null);
    setOpen(false);
    start(async () => {
      const res = await fn();
      setRunning(null);
      setIsError(Boolean(res.error));
      setMessage(res.error ?? res.note ?? "Done.");
      if (!res.error) router.refresh();
    });
  }

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span
          title={message}
          className={cn("max-w-[16rem] truncate text-xs", isError ? "text-red-600" : "text-ink-500")}
        >
          {message}
        </span>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={pending}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MoreHorizontal className="h-3.5 w-3.5" />
          )}
          Actions
          <ChevronDown className="h-3 w-3" />
        </button>

        {open && (
          <>
            {/* Click-away layer, so the menu closes like a native one. */}
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg"
            >
              <Link href={`/stores/${storeId}/edit`} className={item} role="menuitem">
                <Sparkles className="h-4 w-4" /> Edit with EcomAI
              </Link>

              {needsProvision && (
                <button
                  role="menuitem"
                  className={item}
                  disabled={pending}
                  onClick={() => run("provision", () => provisionShopifyStore(storeId))}
                >
                  {running === "provision" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}
                  {isLinked ? "Retry provisioning" : "Provision on Shopify"}
                </button>
              )}

              {hasShopify && (
                <button
                  role="menuitem"
                  className={item}
                  disabled={pending}
                  onClick={() => run("sync", () => syncProductsToShopify(storeId))}
                >
                  {running === "sync" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackagePlus className="h-4 w-4" />
                  )}
                  Sync products
                </button>
              )}

              {hasShopify && isLiquidTheme && (
                <button
                  role="menuitem"
                  className={item}
                  disabled={pending}
                  onClick={() => run("resync", () => resyncShopifyTheme(storeId))}
                >
                  {running === "resync" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Update live store
                </button>
              )}

              {hasShopify && (
                <MakeItYoursButton
                  storeId={storeId}
                  referralUrl={referralUrl}
                  requestedEmail={transferEmail}
                  transferred={transferred}
                  asMenuItem
                  onDone={() => setOpen(false)}
                />
              )}

              <div className="my-1 border-t border-ink-100" />

              <DeleteStoreButton
                storeId={storeId}
                storeName={storeName}
                hasOrders={hasOrders}
                asMenuItem
                onDone={() => setOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
