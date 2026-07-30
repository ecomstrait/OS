import type { Metadata } from "next";
import { Store, CheckCircle2 } from "lucide-react";
import { getMySupplier } from "@/lib/supplier-context";
import { getListingRequests } from "@/lib/listings";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { ListingQueue } from "@/components/listings/listing-queue";

export const metadata: Metadata = { title: "Listing requests" };

export default async function ListingsPage() {
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  const [pending, recent] = approved
    ? await Promise.all([getListingRequests("pending"), getListingRequests("approved", 20)])
    : [[], []];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Listing requests</h1>
      <p className="mt-1 text-sm text-ink-500">
        Merchants asking to sell your products on their stores. Approving puts the product live on
        their storefront, and pushes it to Shopify for Shopify stores.
      </p>

      <div className="mt-6">
        {!approved ? (
          <PendingGate status={supplier?.status ?? null} feature="listing requests" />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nothing waiting"
            body="When a merchant adds one of your products to their store, the request lands here for you to approve."
          />
        ) : (
          <ListingQueue requests={pending} />
        )}
      </div>

      {approved && recent.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
            <CheckCircle2 className="h-4 w-4 text-brand-500" /> Recently approved
          </h2>
          <ul className="mt-3 divide-y divide-ink-50 rounded-2xl border border-ink-100 bg-white">
            {recent.map((r) => (
              <li
                key={`${r.storeId}:${r.productId}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate text-ink-700">
                  {r.productTitle}
                  <span className="text-ink-400"> · {r.storeName}</span>
                </span>
                <span className="shrink-0 font-semibold text-ink-900">
                  {r.price != null ? `$${r.price}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
