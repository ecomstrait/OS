import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { OrderItem } from "@ecomstrait/db/types";
import { ORDER_STATUS_STYLE } from "@/lib/order-status";
import { OrderStatusActions } from "@/components/orders/order-status-actions";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const lines = (items ?? []) as OrderItem[];

  // `order_items.unit_price` is the retail/selling price the customer paid
  // (see storefront-orders.ts / the Shopify webhook on the merchant side) —
  // not what this supplier should see. Show their own cost instead: the
  // wholesale price they set on each product, joined in here since
  // `order_items` has no cost column of its own.
  const productIds = [...new Set(lines.map((l) => l.product_id).filter((v): v is string => Boolean(v)))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, wholesale_price").in("id", productIds)
    : { data: [] };
  const wholesaleById = new Map((products ?? []).map((p) => [p.id, p.wholesale_price]));

  // `orders.cost_amount` (computed once, at order time, in order-sink.ts) is
  // the source of truth for the total — it stays correct even if a
  // product's wholesale price changes afterward. The per-line figures below
  // are a best-effort breakdown of that same total for display.
  const total = order.cost_amount ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-950">
          Order #{order.number}
        </h1>
        <div className="flex items-center gap-2">
          {order.payment_type === "cod" && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Cash on Delivery
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_STYLE[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-ink-500">{order.store_name || "Store"}</p>

      {/* Ship to */}
      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Ship to</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-ink-800">{order.customer_name || "Customer"}</p>
          {order.shipping ? (
            <p className="inline-flex items-start gap-1.5 text-ink-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" /> {order.shipping}
            </p>
          ) : (
            <p className="text-ink-400">No shipping address on file.</p>
          )}
          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-ink-900"
            >
              <Phone className="h-4 w-4 text-ink-400" /> {order.customer_phone}
            </a>
          )}
          {order.customer_email && (
            <a
              href={`mailto:${order.customer_email}`}
              className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900"
            >
              <Mail className="h-4 w-4 text-ink-400" /> {order.customer_email}
            </a>
          )}
        </div>
      </section>

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Items</h2>
        <ul className="mt-3 divide-y divide-ink-50">
          {lines.length === 0 && <li className="py-2 text-sm text-ink-400">No line items.</li>}
          {lines.map((it) => {
            const wholesale = it.product_id ? wholesaleById.get(it.product_id) : undefined;
            const lineCost = wholesale != null ? wholesale * it.quantity : null;
            return (
              <li key={it.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink-800">
                  {it.product_name} <span className="text-ink-400">× {it.quantity}</span>
                </span>
                <span className="font-medium text-ink-600">
                  {lineCost != null ? `$${lineCost.toFixed(2)}` : "—"}
                </span>
              </li>
            );
          })}
        </ul>
        {total > 0 && (
          <div className="mt-3 flex justify-between border-t border-ink-50 pt-3 text-sm">
            <span className="font-semibold text-ink-950">Your cost</span>
            <span className="font-semibold text-ink-950">${total.toFixed(2)}</span>
          </div>
        )}
      </section>

      {/* Fulfilment */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-950">Fulfilment</h2>
        <OrderStatusActions orderId={order.id} status={order.status} />
      </section>

      {order.request_id && (
        <Link
          href={`/requests/${order.request_id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ai-600 hover:underline"
        >
          <MessageSquare className="h-4 w-4" /> View original request &amp; conversation
        </Link>
      )}
    </div>
  );
}
