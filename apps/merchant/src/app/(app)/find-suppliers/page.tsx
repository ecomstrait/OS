import type { Metadata } from "next";
import Link from "next/link";
import { Search, PackageOpen } from "lucide-react";
import { getPublishedCatalog, getSelectedIds } from "@/lib/catalog";
import { ProductCard } from "@/components/catalog/product-card";

export const metadata: Metadata = { title: "Find Suppliers" };

export default async function FindSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [products, selected] = await Promise.all([getPublishedCatalog(q), getSelectedIds()]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Find Suppliers</h1>
          <p className="mt-1 text-sm text-ink-500">
            Browse verified suppliers&apos; products and add them to your inventory.
          </p>
        </div>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
        >
          <PackageOpen className="h-4 w-4" /> Selected ({selected.size})
        </Link>
      </div>

      <form className="mt-5 flex max-w-md items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5">
        <Search className="h-4 w-4 text-ink-400" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ink-400"
        />
        <button type="submit" className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
          Search
        </button>
      </form>

      <div className="mt-6">
        {products.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <PackageOpen className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">
              {q ? `No products match “${q}”.` : "No published products yet — suppliers are still onboarding."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} selected={selected.has(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
