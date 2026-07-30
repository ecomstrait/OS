"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, ImageOff, Loader2, Store, Trash2, XCircle } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { ListingStatus } from "@ecomstrait/db/types";
import type { MerchantListing } from "@/lib/listings";
import { removeListing } from "@/lib/listing-actions";

const STATUS: Record<ListingStatus, { label: string; cls: string; icon: typeof Clock | null }> = {
  pending: { label: "Awaiting supplier", cls: "bg-amber-50 text-amber-700", icon: Clock },
  approved: { label: "Listed", cls: "bg-brand-50 text-brand-700", icon: null },
  declined: { label: "Declined", cls: "bg-red-50 text-red-600", icon: XCircle },
};

/** One product on one store, with the control to take it off that store. */
export function ListingCard({ listing }: { listing: MerchantListing }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const state = STATUS[listing.status];
  const Icon = state.icon;

  function remove() {
    if (!confirm(`Remove "${listing.title}" from ${listing.storeName}?`)) return;
    setError(null);
    start(async () => {
      const res = await removeListing(listing.storeId, listing.productId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white",
        pending && "opacity-60",
      )}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink-50">
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image}
            alt={listing.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            state.cls,
          )}
        >
          {Icon && <Icon className="h-3 w-3" />} {state.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-semibold text-ink-950">{listing.title}</p>
        <p className="line-clamp-1 text-xs text-ink-400">{listing.supplierName}</p>
        <p className="inline-flex items-center gap-1 text-xs text-ink-500">
          <Store className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.storeName}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-ink-900">
          {listing.price != null ? `$${listing.price}` : "—"}
        </p>

        {listing.status === "declined" && listing.declineReason && (
          <p className="mt-1 line-clamp-2 text-[11px] text-red-600" title={listing.declineReason}>
            {listing.declineReason}
          </p>
        )}
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}

        <div className="mt-auto pt-3">
          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 text-sm font-semibold text-ink-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Remove from store
          </button>
        </div>
      </div>
    </div>
  );
}
