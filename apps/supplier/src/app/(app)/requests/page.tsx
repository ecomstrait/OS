import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";

export const metadata: Metadata = { title: "Requests" };

export default async function RequestsPage() {
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Requests</h1>
      <p className="mt-1 text-sm text-ink-500">
        Product requests from store owners will land here.
      </p>
      <div className="mt-6">
        {!approved ? (
          <PendingGate status={supplier?.status ?? null} feature="requests" />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            body="Once you're publishing products, store owners can send you requests to fulfil."
          />
        )}
      </div>
    </div>
  );
}
