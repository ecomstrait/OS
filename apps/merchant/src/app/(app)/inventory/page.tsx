import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, Search, Sparkles } from "lucide-react";
import { getSelectedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/catalog/product-card";

export const metadata: Metadata = { title: "Selected Inventory" };

export default async function InventoryPage() {
  const products = await getSelectedProducts();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Selected Inventory</h1>
          <p className="mt-1 text-sm text-ink-500">
            The products you&apos;ll sell — your Store Builder imports these.
          </p>
        </div>
        {products.length > 0 && (
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Sparkles className="h-4 w-4" /> Build a store
          </Link>
        )}
      </div>

      <div className="mt-6">
        {products.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <PackageOpen className="h-7 w-7" />
            </span>
            <p className="mt-4 max-w-sm text-sm text-ink-500">
              You haven&apos;t selected any products yet. Browse suppliers and add products to sell.
            </p>
            <Link
              href="/find-suppliers"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Search className="h-4 w-4" /> Find Suppliers
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} selected />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
