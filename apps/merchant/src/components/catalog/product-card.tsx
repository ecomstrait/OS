import { ImageOff } from "lucide-react";
import type { ListingStatus } from "@ecomstrait/db/types";
import { productImage, economicsFor, type CatalogProduct } from "@/lib/catalog";
import { AddButton } from "@/components/catalog/add-button";
import { ListingMenu } from "@/components/catalog/listing-menu";
import type { StoreOption } from "@/lib/listings";

export function ProductCard({
  product,
  selected,
  stores,
  listings,
}: {
  product: CatalogProduct;
  selected: boolean;
  /** When the merchant has stores, the card offers "Add to store" instead of
   *  the pre-store basket toggle. */
  stores?: StoreOption[];
  listings?: Record<string, ListingStatus>;
}) {
  const img = productImage(product.images?.[0]);
  const econ = economicsFor(product);
  const lowStock = product.available > 0 && product.available <= 5;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {/*
        `shrink-0` + absolutely-filled image keeps every tile the same box.
        A percentage-height <img> inside a flex item can resolve against an auto
        height and fall back to the file's intrinsic size, which is what made
        portrait product shots render taller than landscape ones.
      */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink-50">
        {/* Margin is the first thing a merchant looks for, so it sits on the image. */}
        {econ.marginPct != null && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {econ.marginPct}% margin
          </span>
        )}
        {product.available <= 0 ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-ink-950/85 px-2.5 py-1 text-[11px] font-semibold text-white">
            Out of stock
          </span>
        ) : lowStock ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            Only {product.available} left
          </span>
        ) : null}
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-semibold text-ink-950">{product.title}</p>
        <p className="line-clamp-1 text-xs text-ink-400">
          {product.supplier_name}
          {product.supplier_score != null ? ` · ${product.supplier_score}/100` : ""}
          {product.category ? ` · ${product.category}` : ""}
        </p>

        {/* Cost → sell → profit, so the economics read left to right. */}
        <div className="mt-2 rounded-lg bg-ink-50 px-2.5 py-2 text-[11px] leading-tight text-ink-500">
          <div className="flex items-baseline justify-between">
            <span>You pay</span>
            <span className="font-semibold text-ink-700">
              {econ.cost != null ? `$${econ.cost}` : "—"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span>You sell at</span>
            <span className="font-semibold text-ink-900">
              {econ.retail != null ? `$${econ.retail}` : "—"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t border-ink-200/70 pt-1">
            <span className="font-medium text-ink-600">Profit / unit</span>
            <span className="font-bold text-brand-600">
              {econ.profit != null ? `$${econ.profit.toFixed(2)}` : "—"}
            </span>
          </div>
        </div>

        {product.available > 0 && (
          <p className="mt-1.5 text-[11px] text-ink-400">{product.available} in stock</p>
        )}
        {/* mt-auto pins the button to the card's bottom edge, so a two-line
            title in one tile doesn't push its button out of line with the rest. */}
        <div className="mt-auto pt-3">
          {stores?.length ? (
            <ListingMenu productId={product.id} stores={stores} listings={listings ?? {}} />
          ) : (
            <AddButton productId={product.id} selected={selected} />
          )}
        </div>
      </div>
    </div>
  );
}
