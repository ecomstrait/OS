"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, ImageOff } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { ListingRequest } from "@/lib/listings";
import { approveListing, declineListing, approveAllPending } from "@/lib/listing-actions";

const STORE_TYPE_LABEL: Record<string, string> = {
  own_platform: "Custom website",
  shopify_liquid_theme: "Shopify · EcomStrait theme",
  shopify_shopify_theme: "Shopify theme",
};

export function ListingQueue({ requests }: { requests: ListingRequest[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const key = (r: ListingRequest) => `${r.storeId}:${r.productId}`;

  function approve(r: ListingRequest) {
    setBusyKey(key(r));
    setNote(null);
    start(async () => {
      const res = await approveListing(r.storeId, r.productId);
      setBusyKey(null);
      setNote(res.error ? `⚠️ ${res.error}` : (res.note ?? "Approved."));
      router.refresh();
    });
  }

  function confirmDecline(r: ListingRequest) {
    setBusyKey(key(r));
    setNote(null);
    start(async () => {
      const res = await declineListing(r.storeId, r.productId, reason);
      setBusyKey(null);
      setDeclining(null);
      setReason("");
      setNote(res.error ? `⚠️ ${res.error}` : "Declined.");
      router.refresh();
    });
  }

  function approveAll() {
    setBusyKey("all");
    setNote(null);
    start(async () => {
      const res = await approveAllPending();
      setBusyKey(null);
      setNote(res.error ? `⚠️ ${res.error}` : `Approved ${res.approved} listing${res.approved === 1 ? "" : "s"}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {note ? (
          <p role="status" className="text-sm text-ink-600">{note}</p>
        ) : (
          <p className="text-sm text-ink-500">
            {requests.length} request{requests.length === 1 ? "" : "s"} waiting on you.
          </p>
        )}
        <button
          onClick={approveAll}
          disabled={pending || requests.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busyKey === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve all
        </button>
      </div>

      <ul className={cn("divide-y divide-ink-50 overflow-hidden rounded-2xl border border-ink-100 bg-white", pending && "opacity-70")}>
        {requests.map((r) => {
          const k = key(r);
          return (
            <li key={k} className="flex flex-wrap items-center gap-4 px-4 py-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-100 text-ink-300">
                {r.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.productImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{r.productTitle}</p>
                <p className="truncate text-xs text-ink-500">
                  {r.storeName}
                  <span className="text-ink-300"> · {STORE_TYPE_LABEL[r.storeType] ?? r.storeType}</span>
                  {r.merchantEmail ? <span className="text-ink-300"> · {r.merchantEmail}</span> : null}
                </p>
              </div>

              <span className="shrink-0 text-sm font-bold text-ink-900">
                {r.price != null ? `$${r.price}` : "—"}
              </span>

              {declining === k ? (
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                    aria-label="Decline reason"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 sm:w-56"
                  />
                  <button
                    onClick={() => confirmDecline(r)}
                    disabled={pending}
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-red-500 px-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {busyKey === k ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                  </button>
                  <button
                    onClick={() => { setDeclining(null); setReason(""); }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setDeclining(k)}
                    disabled={pending}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => approve(r)}
                    disabled={pending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {busyKey === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
