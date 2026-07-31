import { createAdminClient } from "@ecomstrait/db";
import { propagateStockAfterSale } from "@/lib/product-propagation";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

export type SoldItem = {
  product_id: string | null;
  supplier_id: string | null;
  name: string;
  quantity: number;
  unit_price: number | null;
};

/**
 * Record a paid customer order (from own-platform Stripe or a Shopify webhook),
 * route it to the relevant suppliers, and decrement inventory. Idempotent on
 * `externalId`. Shared by the checkout-success page and the Shopify webhook.
 */
export async function recordCustomerOrder(
  admin: Admin,
  opts: {
    storeId: string;
    externalId: string;
    customerName?: string | null;
    customerEmail?: string | null;
    shipping?: string | null;
    items: SoldItem[];
  },
): Promise<void> {
  const { data: existing } = await admin
    .from("store_orders")
    .select("id")
    .eq("stripe_session_id", opts.externalId)
    .maybeSingle();
  if (existing || opts.items.length === 0) return;

  const subtotal = opts.items.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0);

  await admin.from("store_orders").insert({
    store_id: opts.storeId,
    customer_name: opts.customerName ?? null,
    customer_email: opts.customerEmail ?? null,
    shipping: opts.shipping ?? null,
    subtotal,
    items: opts.items,
    status: "paid",
    stripe_session_id: opts.externalId,
  });

  const { data: store } = await admin.from("stores").select("name").eq("id", opts.storeId).maybeSingle();

  // One supplier order per supplier, with the customer's shipping address.
  const bySupplier = new Map<string, SoldItem[]>();
  for (const i of opts.items) {
    if (!i.supplier_id) continue;
    const arr = bySupplier.get(i.supplier_id) ?? [];
    arr.push(i);
    bySupplier.set(i.supplier_id, arr);
  }
  for (const [supplierId, supItems] of bySupplier) {
    const { data: order } = await admin
      .from("orders")
      .insert({
        supplier_id: supplierId,
        store_name: store?.name ?? null,
        store_owner_name: opts.customerName ?? null,
        store_owner_email: opts.customerEmail ?? null,
        shipping: opts.shipping ?? null,
        status: "processing",
      })
      .select("id")
      .single();
    if (order) {
      await admin.from("order_items").insert(
        supItems.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      );
    }
  }

  // Two-way inventory: decrement supplier stock for matched products.
  const productIds = opts.items.map((i) => i.product_id).filter(Boolean) as string[];
  if (productIds.length) {
    const { data: prods } = await admin.from("products").select("id, stock").in("id", productIds);
    for (const i of opts.items) {
      const p = (prods ?? []).find((x) => x.id === i.product_id);
      if (!p) continue;
      const next = Math.max(0, (p.stock ?? 0) - i.quantity);
      await admin.from("products").update({ stock: next }).eq("id", i.product_id!);
      await admin
        .from("inventory_adjustments")
        .insert({ product_id: i.product_id!, delta: -i.quantity, resulting_stock: next, reason: "Store sale" });
    }

    // The same product is often listed on several stores. Shopify only knows
    // about the copy that sold, so without this every other store keeps
    // advertising stock that's already gone — and oversells it.
    await propagateStockAfterSale(productIds);
  }
}
