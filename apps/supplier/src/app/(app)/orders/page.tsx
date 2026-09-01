import Link from "next/link";
import type { Metadata } from "next";
import { Package, ArrowRight, SearchX } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { OrderStatus } from "@ecomstrait/db/types";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { SearchBar } from "@/components/app/search-bar";
import { Pagination } from "@/components/app/pagination";
import { ORDER_STATUS_STYLE, ORDER_STATUS_ORDER } from "@/lib/order-status";
import { clampPage, likeTerm, pageSlice, parseTableParams, type RawParams } from "@/lib/table-params";

export const metadata: Metadata = { title: "Orders" };

type Row = {
  id: string;
  number: number;
  store_name: string | null;
  customer_name: string | null;
  status: OrderStatus;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const { q, page: wanted, size } = parseTableParams(params);

  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  let orders: Row[] = [];
  let total = 0;
  let page = wanted;
  let active = 0;

  if (supplier && approved) {
    // `orders.status` is plain text, so "active first" can't be an ORDER BY.
    // Pull just the sort keys for every matching row, order them here, then
    // hydrate only the current page — the nested order_items stay paginated.
    // Held orders (credit_status != 'deducted') are awaiting the supplier's
    // own wallet to cover a COD margin+fee deduction — they stay invisible
    // here until that clears, per Docs/Credits-Settlement-Plan.md.
    let keyQuery = supabase
      .from("orders")
      .select("id, status")
      .eq("supplier_id", supplier.supplierId)
      .eq("credit_status", "deducted");
    if (q) {
      keyQuery = keyQuery.or(
        `store_name.ilike.${likeTerm(q)},customer_name.ilike.${likeTerm(q)}`,
      );
    }
    const { data: keys } = await keyQuery.order("created_at", { ascending: false });

    const ordered = (keys ?? []) as { id: string; status: OrderStatus }[];
    ordered.sort((a, b) => ORDER_STATUS_ORDER[a.status] - ORDER_STATUS_ORDER[b.status]);

    total = ordered.length;
    active = ordered.filter((o) => o.status === "processing" || o.status === "shipped").length;
    page = clampPage(wanted, total, size);

    const pageIds = pageSlice(ordered, page, size).map((o) => o.id);
    if (pageIds.length) {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, number, store_name, customer_name, status, created_at, order_items(product_name, quantity)",
        )
        .eq("supplier_id", supplier.supplierId)
        .in("id", pageIds);
      // `.in()` doesn't preserve the id order we asked for — restore it.
      const hydrated = (data ?? []) as unknown as Row[];
      const byId = new Map(hydrated.map((o) => [o.id, o]));
      orders = pageIds.map((id) => byId.get(id)).filter((o): o is Row => Boolean(o));
    }
  }

  const searching = q.length > 0;
  const summary =
    total > 0 ? `${(page - 1) * size + 1}–${(page - 1) * size + orders.length} of ${total}` : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Orders</h1>
      <p className="mt-1 text-sm text-ink-500">
        {approved
          ? active > 0
            ? `${active} order${active === 1 ? "" : "s"} to fulfil.`
            : "Accepted requests become orders you fulfil here."
          : "Accepted requests become orders you fulfil here."}
      </p>

      <div className="mt-6">
        {!approved ? (
          <PendingGate status={supplier?.status ?? null} feature="orders" />
        ) : total === 0 && !searching ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            body="When you accept a product request, it becomes an order here to fulfil."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SearchBar placeholder="Search by store or owner…" summary={summary} />
            {orders.length === 0 ? (
              <EmptyState icon={SearchX} title="No matches" body={`No orders match “${q}”.`} />
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                  {orders.map((o) => {
                    const items = o.order_items ?? [];
                    const summaryText =
                      items.length === 0
                        ? "—"
                        : `${items[0].quantity}× ${items[0].product_name}${items.length > 1 ? ` +${items.length - 1} more` : ""}`;
                    return (
                      <Link
                        key={o.id}
                        href={`/orders/${o.id}`}
                        className="flex items-center justify-between gap-4 border-b border-ink-50 px-4 py-4 transition last:border-0 hover:bg-ink-50/50"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">
                            #{o.number} · {o.store_name || o.customer_name || "Customer"}
                          </p>
                          <p className="truncate text-sm text-ink-500">{summaryText}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_STYLE[o.status]}`}>
                            {o.status}
                          </span>
                          <ArrowRight className="h-4 w-4 text-ink-300" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Pagination basePath="/orders" params={params} page={page} total={total} size={size} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
