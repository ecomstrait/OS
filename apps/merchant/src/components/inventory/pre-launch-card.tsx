"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageOff, Loader2, Sparkles, Trash2 } from "lucide-react";
import { removeSelectedProduct } from "@/lib/catalog-actions";

/**
 * Plain, already-resolved fields only — deliberately not `CatalogProduct`
 * itself, which lives in `@/lib/catalog` alongside server-only imports
 * (`@ecomstrait/auth/server`). This is a client component; pulling that
 * module in here (even just for the type) drags its whole import chain into
 * the client bundle and breaks the build. The server page resolves the
 * image URL via `productImage()` before handing this down.
 */
export type PreLaunchProduct = {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  supplierName: string;
};

/**
 * One product queued in the pre-launch `selected_products` basket — chosen
 * from Find Suppliers (or a Store Builder suggestion) before it's attached
 * to any actual store. Deliberately a much simpler card than `ListingCard`:
 * there's no store yet, so none of that card's per-store price override,
 * shipping note, or supplier-approval status applies here.
 */
export function PreLaunchSelectionCard({ product }: { product: PreLaunchProduct }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirm(`Remove "${product.title}" from your selection?`)) return;
    setError(null);
    start(async () => {
      const res = await removeSelectedProduct(product.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-ink-200 bg-white">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink-50">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ai-50 px-2.5 py-1 text-[11px] font-semibold text-ai-700">
          <Sparkles className="h-3 w-3" /> Queued for a new store
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-semibold text-ink-950">{product.title}</p>
        <p className="line-clamp-1 text-xs text-ink-400">{product.supplierName}</p>
        <p className="mt-1 text-sm font-bold text-ink-900">
          {product.price != null ? `$${product.price}` : "—"}
        </p>
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}

        <div className="mt-auto pt-3">
          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 text-sm font-semibold text-ink-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
