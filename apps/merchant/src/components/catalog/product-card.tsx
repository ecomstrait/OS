import { ImageOff } from "lucide-react";
import { productImage, type CatalogProduct } from "@/lib/catalog";
import { AddButton } from "@/components/catalog/add-button";

export function ProductCard({
  product,
  selected,
}: {
  product: CatalogProduct;
  selected: boolean;
}) {
  const img = productImage(product.images?.[0]);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {/*
        `shrink-0` + absolutely-filled image keeps every tile the same box.
        A percentage-height <img> inside a flex item can resolve against an auto
        height and fall back to the file's intrinsic size, which is what made
        portrait product shots render taller than landscape ones.
      */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink-50">
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
          {product.category ? ` · ${product.category}` : ""}
        </p>
        <p className="mt-1 text-sm font-bold text-ink-900">
          {product.retail_price != null ? `$${product.retail_price}` : "—"}
        </p>
        {/* mt-auto pins the button to the card's bottom edge, so a two-line
            title in one tile doesn't push its button out of line with the rest. */}
        <div className="mt-auto pt-3">
          <AddButton productId={product.id} selected={selected} />
        </div>
      </div>
    </div>
  );
}
