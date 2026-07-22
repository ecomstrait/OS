import Link from "next/link";
import type { Metadata } from "next";
import { Package, ArrowRight } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { OrderStatus } from "@ecomstrait/db/types";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { ORDER_STATUS_STYLE, ORDER_STATUS_ORDER } from "@/lib/order-status";

export const metadata: Metadata = { title: "Orders" };

type Row = {
  id: string;
  number: number;
  store_name: string | null;
  store_owner_name: string | null;
  status: OrderStatus;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  const { data } =
    supplier && approved
      ? await supabase
          .from("orders")
          .select("id, number, store_name, store_owner_name, status, created_at, order_items(product_name, quantity)")
          .eq("supplier_id", supplier.supplierId)
          .order("created_at", { ascending: false })
      : { data: [] };

  const orders = ((data ?? []) as Row[]).sort(
    (a, b) => ORDER_STATUS_ORDER[a.status] - ORDER_STATUS_ORDER[b.status],
  );
  const active = orders.filter((o) => o.status === "processing" || o.status === "shipped").length;

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
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            body="When you accept a product request, it becomes an order here to fulfil."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {orders.map((o) => {
              const items = o.order_items ?? [];
              const summary =
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
                      #{o.number} · {o.store_name || o.store_owner_name || "Store owner"}
                    </p>
                    <p className="truncate text-sm text-ink-500">{summary}</p>
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
        )}
      </div>
    </div>
  );
}
