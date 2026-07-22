import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, ArrowRight } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { RequestStatus } from "@ecomstrait/db/types";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { REQUEST_STATUS_STYLE, REQUEST_STATUS_ORDER } from "@/lib/request-status";

export const metadata: Metadata = { title: "Requests" };

type Row = {
  id: string;
  store_name: string | null;
  store_owner_name: string | null;
  status: RequestStatus;
  timeline: string | null;
  created_at: string;
  request_items: { product_name: string; quantity: number }[];
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  const { data } =
    supplier && approved
      ? await supabase
          .from("product_requests")
          .select("id, store_name, store_owner_name, status, timeline, created_at, request_items(product_name, quantity)")
          .eq("supplier_id", supplier.supplierId)
          .order("created_at", { ascending: false })
      : { data: [] };

  const requests = ((data ?? []) as Row[]).sort((a, b) => REQUEST_STATUS_ORDER[a.status] - REQUEST_STATUS_ORDER[b.status]);
  const openCount = requests.filter((r) => r.status === "new" || r.status === "proposed").length;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Requests</h1>
      <p className="mt-1 text-sm text-ink-500">
        {approved
          ? openCount > 0
            ? `${openCount} request${openCount === 1 ? "" : "s"} need your response.`
            : "Product requests from store owners land here."
          : "Product requests from store owners will land here."}
      </p>

      <div className="mt-6">
        {!approved ? (
          <PendingGate status={supplier?.status ?? null} feature="requests" />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            body="Once you're publishing products, store owners can send you requests to fulfil."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {requests.map((r) => {
              const items = r.request_items ?? [];
              const summary =
                items.length === 0
                  ? "—"
                  : `${items[0].quantity}× ${items[0].product_name}${items.length > 1 ? ` +${items.length - 1} more` : ""}`;
              return (
                <Link
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className="flex items-center justify-between gap-4 border-b border-ink-50 px-4 py-4 transition last:border-0 hover:bg-ink-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">
                      {r.store_name || r.store_owner_name || "Store owner"}
                    </p>
                    <p className="truncate text-sm text-ink-500">
                      {summary}
                      {r.timeline ? ` · ${r.timeline}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${REQUEST_STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
