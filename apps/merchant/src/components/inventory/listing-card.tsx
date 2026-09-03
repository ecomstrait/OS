"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, ImageOff, Loader2, Pencil, Store, Trash2, Truck, X, XCircle } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { ListingStatus } from "@ecomstrait/db/types";
import type { MerchantListing } from "@/lib/listings";
import { removeListing, updateListingPrice, updateListingShippingNote } from "@/lib/listing-actions";

const SHIPPING_NOTE_MAX = 140;

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
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(listing.price != null ? String(listing.price) : "");
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(listing.shippingNote ?? "");

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

  function savePrice() {
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (listing.mapPrice != null && price < listing.mapPrice) {
      setError(`Can't price below the MAP ($${listing.mapPrice.toFixed(2)}) set by the supplier.`);
      return;
    }
    setError(null);
    start(async () => {
      const res = await updateListingPrice(listing.storeId, listing.productId, price);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditingPrice(false);
      router.refresh();
    });
  }

  function saveNote() {
    if (noteInput.length > SHIPPING_NOTE_MAX) {
      setError(`Keep it under ${SHIPPING_NOTE_MAX} characters.`);
      return;
    }
    setError(null);
    start(async () => {
      const res = await updateListingShippingNote(listing.storeId, listing.productId, noteInput);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditingNote(false);
      router.refresh();
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
        {editingPrice ? (
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                step="0.01"
                autoFocus
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") savePrice();
                  if (e.key === "Escape") setEditingPrice(false);
                }}
                className="h-8 w-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
              />
              <button
                onClick={savePrice}
                disabled={pending}
                aria-label="Save price"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  setEditingPrice(false);
                  setError(null);
                  setPriceInput(listing.price != null ? String(listing.price) : "");
                }}
                aria-label="Cancel"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {(listing.msrp != null || listing.mapPrice != null) && (
              <p className="text-[11px] text-ink-400">
                {listing.msrp != null && `MSRP $${listing.msrp.toFixed(2)}`}
                {listing.msrp != null && listing.mapPrice != null && " · "}
                {listing.mapPrice != null && `Min $${listing.mapPrice.toFixed(2)}`}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setEditingPrice(true)}
            className="group mt-1 inline-flex items-center gap-1.5 text-left"
          >
            <span className="text-sm font-bold text-ink-900">
              {listing.price != null ? `$${listing.price}` : "—"}
            </span>
            <Pencil className="h-3 w-3 text-ink-300 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}

        {editingNote ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              maxLength={SHIPPING_NOTE_MAX}
              placeholder="Free shipping over $50, 30-day returns"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNote();
                if (e.key === "Escape") setEditingNote(false);
              }}
              className="h-8 min-w-0 flex-1 rounded-lg border border-ink-200 px-2 text-xs outline-none focus:border-brand-400"
            />
            <button
              onClick={saveNote}
              disabled={pending}
              aria-label="Save shipping note"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => {
                setEditingNote(false);
                setError(null);
                setNoteInput(listing.shippingNote ?? "");
              }}
              aria-label="Cancel"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingNote(true)}
            className="group mt-1 inline-flex items-center gap-1.5 text-left"
          >
            <Truck className="h-3 w-3 shrink-0 text-ink-300" />
            <span className="line-clamp-1 text-xs text-ink-500">
              {listing.shippingNote || "Add shipping/returns note"}
            </span>
            <Pencil className="h-3 w-3 shrink-0 text-ink-300 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}

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
