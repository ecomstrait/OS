import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";

export const metadata: Metadata = { title: "Orders" };

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-brand-50 text-brand-700",
  processing: "bg-ai-50 text-ai-700",
  fulfilled: "bg-brand-50 text-brand-700",
  refunded: "bg-ink-100 text-ink-500",
  cancelled: "bg-ink-100 text-ink-400",
};

const HELD_STYLE = "bg-amber-50 text-amber-700";

function money(n: number | null): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("user_id", user!.id);
  const storeName = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const storeIds = (stores ?? []).map((s) => s.id);

  const { data: orders } = storeIds.length
    ? await supabase
        .from("store_orders")
        .select("id, store_id, customer_name, customer_email, subtotal, items, status, created_at")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const list = orders ?? [];

  // Which of these are stuck on low wallet credits (Docs/Credits-Settlement-Plan.md):
  // same "unpaid / low credits" state the Wallet page's held-orders banner
  // surfaces, but a merchant may never visit /wallet to see it — mark it
  // right on the order itself too. `orders` has no merchant-facing RLS policy
  // (it's scoped to suppliers), so this reads via the admin client, same as
  // the Wallet page's held-orders query.
  const admin = createAdminClient();
  const storeOrderIds = list.map((o) => o.id);
  let heldStoreOrderIds = new Set<string>();
  if (admin && storeOrderIds.length) {
    const { data: linked } = await admin
      .from("orders")
      .select("store_order_id, credit_status")
      .in("store_order_id", storeOrderIds)
      .eq("credit_status", "awaiting_merchant_credits");
    heldStoreOrderIds = new Set((linked ?? []).map((o) => o.store_order_id).filter((id): id is string => Boolean(id)));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Orders</h1>
        <p className="mt-1 text-sm text-ink-500">
          Customer orders across your stores, routed to suppliers for fulfilment.
        </p>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <p className="mt-4 max-w-sm text-sm text-ink-500">
              No orders yet. When a customer buys from one of your stores, it shows here and is sent
              to the supplier.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Store</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => {
                  const items = o.items ?? [];
                  const units = items.reduce((s, i) => s + i.quantity, 0);
                  const summary = items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
                  const held = heldStoreOrderIds.has(o.id);
                  return (
                    <tr key={o.id} className="border-b border-ink-50 align-top last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-ink-400">{when(o.created_at)}</p>
                        {held && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Not sent to supplier — add credits
                          </p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-ink-600 sm:table-cell">
                        {storeName.get(o.store_id) ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <p className="text-ink-700">{o.customer_name ?? "—"}</p>
                        <p className="text-xs text-ink-400">{o.customer_email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-700">{units} unit{units === 1 ? "" : "s"}</p>
                        <p className="max-w-[16rem] truncate text-xs text-ink-400" title={summary}>
                          {summary}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink-900">
                        {money(o.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            held ? HELD_STYLE : (STATUS_STYLE[o.status] ?? "bg-ink-100 text-ink-500")
                          }`}
                        >
                          {held ? "unpaid / low credits" : o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
