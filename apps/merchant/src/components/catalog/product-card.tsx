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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="aspect-[4/3] w-full bg-ink-50">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-1 text-sm font-semibold text-ink-950">{product.title}</p>
        <p className="text-xs text-ink-400">
          {product.supplier_name}
          {product.category ? ` · ${product.category}` : ""}
        </p>
        <p className="mt-1 text-sm font-bold text-ink-900">
          {product.retail_price != null ? `$${product.retail_price}` : "—"}
        </p>
        <div className="mt-3">
          <AddButton productId={product.id} selected={selected} />
        </div>
      </div>
    </div>
  );
}
