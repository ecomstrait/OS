import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, ArrowRight, SearchX } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { RequestStatus } from "@ecomstrait/db/types";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { SearchBar } from "@/components/app/search-bar";
import { Pagination } from "@/components/app/pagination";
import { REQUEST_STATUS_STYLE, REQUEST_STATUS_ORDER } from "@/lib/request-status";
import { clampPage, likeTerm, pageSlice, parseTableParams, type RawParams } from "@/lib/table-params";

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

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const { q, page: wanted, size } = parseTableParams(params);

  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  let requests: Row[] = [];
  let total = 0;
  let page = wanted;
  let openCount = 0;

  if (supplier && approved) {
    // `product_requests.status` is plain text, so the "needs attention first"
    // order can't be an ORDER BY. Sort keys here, hydrate only this page.
    let keyQuery = supabase
      .from("product_requests")
      .select("id, status")
      .eq("supplier_id", supplier.supplierId);
    if (q) {
      keyQuery = keyQuery.or(
        `store_name.ilike.${likeTerm(q)},store_owner_name.ilike.${likeTerm(q)},timeline.ilike.${likeTerm(q)}`,
      );
    }
    const { data: keys } = await keyQuery.order("created_at", { ascending: false });

    const ordered = (keys ?? []) as { id: string; status: RequestStatus }[];
    ordered.sort((a, b) => REQUEST_STATUS_ORDER[a.status] - REQUEST_STATUS_ORDER[b.status]);

    total = ordered.length;
    openCount = ordered.filter((r) => r.status === "new" || r.status === "proposed").length;
    page = clampPage(wanted, total, size);

    const pageIds = pageSlice(ordered, page, size).map((r) => r.id);
    if (pageIds.length) {
      const { data } = await supabase
        .from("product_requests")
        .select(
          "id, store_name, store_owner_name, status, timeline, created_at, request_items(product_name, quantity)",
        )
        .eq("supplier_id", supplier.supplierId)
        .in("id", pageIds);
      const hydrated = (data ?? []) as unknown as Row[];
      const byId = new Map(hydrated.map((r) => [r.id, r]));
      requests = pageIds.map((id) => byId.get(id)).filter((r): r is Row => Boolean(r));
    }
  }

  const searching = q.length > 0;
  const summary =
    total > 0 ? `${(page - 1) * size + 1}–${(page - 1) * size + requests.length} of ${total}` : undefined;

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
        ) : total === 0 && !searching ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            body="Once you're publishing products, store owners can send you requests to fulfil."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SearchBar placeholder="Search by store, owner, timeline…" summary={summary} />
            {requests.length === 0 ? (
              <EmptyState icon={SearchX} title="No matches" body={`No requests match “${q}”.`} />
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                  {requests.map((r) => {
                    const items = r.request_items ?? [];
                    const summaryText =
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
                            {summaryText}
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
                <Pagination basePath="/requests" params={params} page={page} total={total} size={size} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
