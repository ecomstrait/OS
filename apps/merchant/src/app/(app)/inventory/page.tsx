import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, Search, Sparkles, X } from "lucide-react";
import { getMerchantStores, getMerchantListings } from "@/lib/listings";
import { ListingCard } from "@/components/inventory/listing-card";
import { FilterSelect } from "@/components/catalog/filter-select";

export const metadata: Metadata = { title: "Selected Inventory" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; status?: string }>;
}) {
  const { store = "", status = "" } = await searchParams;

  const [stores, all] = await Promise.all([getMerchantStores(), getMerchantListings()]);

  // An unrecognised store id would otherwise fall through and show everything.
  const validStore = stores.some((s) => s.id === store) ? store : "";
  const listings = all.filter(
    (l) => (!validStore || l.storeId === validStore) && (!status || l.status === status),
  );

  const counts = {
    all: all.length,
    pending: all.filter((l) => l.status === "pending").length,
    approved: all.filter((l) => l.status === "approved").length,
    declined: all.filter((l) => l.status === "declined").length,
  };
  const filtering = Boolean(validStore || status);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Selected Inventory</h1>
          <p className="mt-1 text-sm text-ink-500">
            The products you&apos;re selling, and which store each one is on.
          </p>
        </div>
        <Link
          href="/find-suppliers"
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
        >
          <Search className="h-4 w-4" /> Find more products
        </Link>
      </div>

      {all.length > 0 && (
        <form className="mt-5 flex flex-wrap items-center gap-2">
          <FilterSelect
            key={`store:${validStore}`}
            name="store"
            value={validStore}
            allLabel={`All stores (${counts.all})`}
            ariaLabel="Filter by store"
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FilterSelect
            key={`status:${status}`}
            name="status"
            value={status}
            allLabel="Any status"
            ariaLabel="Filter by listing status"
            options={[
              { value: "approved", label: `Listed (${counts.approved})` },
              { value: "pending", label: `Awaiting supplier (${counts.pending})` },
              { value: "declined", label: `Declined (${counts.declined})` },
            ]}
          />
          {filtering && (
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Link>
          )}
          <span className="text-sm text-ink-500">
            {listings.length} of {counts.all}
          </span>
        </form>
      )}

      <div className="mt-6">
        {all.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <PackageOpen className="h-7 w-7" />
            </span>
            <p className="mt-4 max-w-sm text-sm text-ink-500">
              Nothing listed yet. Browse suppliers and add products to one of your stores.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/find-suppliers"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Search className="h-4 w-4" /> Find Suppliers
              </Link>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                <Sparkles className="h-4 w-4" /> Build a store
              </Link>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <p className="text-sm text-ink-500">Nothing matches those filters.</p>
            <Link href="/inventory" className="mt-3 text-sm font-semibold text-brand-600 hover:underline">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={`${l.storeId}:${l.productId}`} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
