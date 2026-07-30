"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ExternalLink, Loader2, X } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { getStoreReadiness, type ReadinessCheck } from "@/lib/shopify-actions";

/**
 * Launch checklist for a provisioned Shopify store.
 *
 * A store can provision cleanly and still refuse to take an order — products
 * unpublished, no shipping rate, no payment provider. Each check links to the
 * Shopify page that fixes it.
 */
/** Mounted only while open, so the checks re-run on each visit. */
export function ReadinessDialog({
  storeId,
  onClose,
}: {
  storeId: string;
  onClose: () => void;
}) {
  // Starts true: the component only exists while the dialog is open, so the
  // fetch is always in flight on mount. Flipping it inside the effect would be
  // a synchronous setState in an effect body.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<ReadinessCheck[] | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreReadiness(storeId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.error) setError(res.error);
      else {
        setChecks(res.checks ?? []);
        setShopDomain(res.shopDomain ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const blocking = (checks ?? []).filter((c) => c.ok === false).length;
  const adminBase = shopDomain ? `https://admin.shopify.com/store/${shopDomain.split(".")[0]}` : null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-ink-100 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-ink-950">Launch checklist</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Everything that has to be true before this store can take an order.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking the store…
          </p>
        ) : error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <>
            {blocking > 0 && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {blocking} thing{blocking === 1 ? "" : "s"} still blocking a sale.
              </p>
            )}

            <ul className="mt-4 flex flex-col gap-2">
              {(checks ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-ink-100 px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                      c.ok === true
                        ? "bg-brand-50 text-brand-600"
                        : c.ok === false
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600",
                    )}
                  >
                    {c.ok === true ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{c.label}</span>
                    <span className="block text-xs text-ink-500">{c.detail}</span>
                  </span>
                  {c.fixPath && adminBase && (
                    <a
                      href={`${adminBase}/${c.fixPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Fix <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11px] text-ink-400">
              Payments can&apos;t be set up through the API — Shopify requires the store owner to do
              it, so we can&apos;t verify or configure it for you.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
