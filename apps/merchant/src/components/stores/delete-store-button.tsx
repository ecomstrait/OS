"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X, AlertTriangle } from "lucide-react";
import { deleteStore } from "@/lib/store-actions";

/**
 * Deleting a store is irreversible, so it asks for the store's name rather than
 * a bare confirm dialog. Stores with paid orders are archived instead — the
 * copy says so up front, so the outcome isn't a surprise.
 */
export function DeleteStoreButton({
  storeId,
  storeName,
  hasOrders,
}: {
  storeId: string;
  storeName: string;
  hasOrders: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await deleteStore(storeId, value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setValue("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Delete ${storeName}`}
        title="Delete store"
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => !pending && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-ink-100 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <p className="text-base font-bold text-ink-950">
                  {hasOrders ? "Archive this store?" : "Delete this store?"}
                </p>
              </div>
              <button
                onClick={() => !pending && setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-ink-600">
              {hasOrders ? (
                <>
                  <strong>{storeName}</strong> has paid orders, so it will be archived rather than
                  erased — the order records are kept. It stops serving and leaves your active
                  stores.
                </>
              ) : (
                <>
                  <strong>{storeName}</strong> and its product listings will be permanently removed.
                  This can&apos;t be undone.
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-ink-400">
              Any Shopify dev store attached to it is released back to the pool, not deleted.
            </p>

            <label className="mt-4 block text-xs font-semibold text-ink-700">
              Type <span className="font-mono text-ink-900">{storeName}</span> to confirm
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoFocus
                className="mt-1.5 h-10 w-full rounded-xl border border-ink-200 px-3 text-sm font-normal outline-none focus:border-red-400"
              />
            </label>

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || value.trim().length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {hasOrders ? "Archive" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
