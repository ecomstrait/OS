import { createAdminClient } from "@ecomstrait/db";
import type { OrderPaymentType } from "@ecomstrait/db";
import { propagateStockAfterSale } from "@/lib/product-propagation";
import { debitWallet, recordPayable, platformFee } from "@ecomstrait/db/wallet";
import { sendEmail } from "@/lib/notify";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

export type SoldItem = {
  product_id: string | null;
  supplier_id: string | null;
  name: string;
  quantity: number;
  unit_price: number | null;
};

/**
 * Tell a supplier they have COD orders held on their own wallet balance.
 * Best-effort — `suppliers` has no email column, so this resolves the
 * owner's auth email via the admin client, mirroring how a merchant's own
 * account email works today.
 */
async function notifySupplierOrdersWaiting(admin: Admin, supplierId: string): Promise<void> {
  try {
    const { data: supplier } = await admin
      .from("suppliers")
      .select("owner_user_id")
      .eq("id", supplierId)
      .maybeSingle();
    if (!supplier?.owner_user_id) return;

    const { data } = await admin.auth.admin.getUserById(supplier.owner_user_id);
    const email = data.user?.email;
    if (!email) return;

    await sendEmail({
      to: email,
      subject: "Orders waiting — add credits to receive them",
      html: `<p>You have Cash on Delivery orders waiting that your wallet balance can't currently
        cover (each COD order deducts your margin share + the platform fee up front).</p>
        <p>Add credits to your wallet to release them — they'll come through automatically once
        your balance covers what's due.</p>`,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Record a paid customer order (from own-platform Stripe or a Shopify webhook),
 * route it to the relevant suppliers, and decrement inventory. Idempotent on
 * `externalId`. Shared by the checkout-success page and the Shopify webhook.
 *
 * `paymentType` decides which side's wallet funds this sale
 * (Docs/Credits-Settlement-Plan.md): `prepaid` (the merchant already
 * collected the money, e.g. Shopify/Stripe checkout) debits the merchant's
 * wallet for the supplier's cost + platform fee; `cod` (the supplier collects
 * cash at delivery) debits the supplier's wallet for the merchant's margin +
 * platform fee, up front. An order whose wallet can't cover its deduction is
 * still created, held (`credit_status`), and excluded from the supplier's
 * queue until a top-up releases it — it is never silently dropped.
 */
export async function recordCustomerOrder(
  admin: Admin,
  opts: {
    storeId: string;
    externalId: string;
    paymentType: OrderPaymentType;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
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

  const { data: storeOrder } = await admin
    .from("store_orders")
    .insert({
      store_id: opts.storeId,
      customer_name: opts.customerName ?? null,
      customer_email: opts.customerEmail ?? null,
      shipping: opts.shipping ?? null,
      subtotal,
      items: opts.items,
      status: "paid",
      stripe_session_id: opts.externalId,
    })
    .select("id")
    .single();

  const { data: store } = await admin
    .from("stores")
    .select("name, user_id")
    .eq("id", opts.storeId)
    .maybeSingle();

  // Fetched once up front (not just for the suppliers' stock decrement below)
  // because cost/margin also need each item's wholesale price, snapshotted
  // onto the order now — `products.wholesale_price` can change later, and
  // the ledger must reflect what was actually charged at order time.
  const productIds = opts.items.map((i) => i.product_id).filter(Boolean) as string[];
  const { data: prods } = productIds.length
    ? await admin.from("products").select("id, stock, wholesale_price").in("id", productIds)
    : { data: [] };
  const productById = new Map((prods ?? []).map((p) => [p.id, p]));

  // One supplier order per supplier, with the customer's shipping address.
  const bySupplier = new Map<string, SoldItem[]>();
  for (const i of opts.items) {
    if (!i.supplier_id) continue;
    const arr = bySupplier.get(i.supplier_id) ?? [];
    arr.push(i);
    bySupplier.set(i.supplier_id, arr);
  }
  for (const [supplierId, supItems] of bySupplier) {
    const supplierSubtotal = supItems.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0);
    const costAmount = supItems.reduce((s, i) => {
      const wholesale = i.product_id ? (productById.get(i.product_id)?.wholesale_price ?? 0) : 0;
      return s + wholesale * i.quantity;
    }, 0);
    const marginAmount = Math.max(0, supplierSubtotal - costAmount);
    const feeAmount = platformFee(supplierSubtotal);

    const { data: order } = await admin
      .from("orders")
      .insert({
        supplier_id: supplierId,
        store_id: opts.storeId,
        store_order_id: storeOrder?.id ?? null,
        store_name: store?.name ?? null,
        customer_name: opts.customerName ?? null,
        customer_email: opts.customerEmail ?? null,
        customer_phone: opts.customerPhone ?? null,
        shipping: opts.shipping ?? null,
        status: "processing",
        payment_type: opts.paymentType,
        cost_amount: costAmount,
        margin_amount: marginAmount,
        platform_fee_amount: feeAmount,
      })
      .select("id")
      .single();
    if (!order) continue;

    await admin.from("order_items").insert(
      supItems.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    );

    if (opts.paymentType === "prepaid") {
      // The merchant already holds 100% of this sale — they owe the
      // supplier's cost and the platform fee. `store` should always resolve
      // (storeId is a real FK), but if it somehow doesn't, hold the order
      // rather than default to `deducted` and expose it to the supplier
      // un-charged.
      if (!store?.user_id) {
        await admin.from("orders").update({ credit_status: "awaiting_merchant_credits" }).eq("id", order.id);
        continue;
      }
      const debit = await debitWallet(admin, costAmount + feeAmount, {
        accountType: "merchant",
        accountId: store.user_id,
        kind: "order_deduction",
        orderId: order.id,
        note: `Order ${order.id}: supplier cost + platform fee`,
      });
      if (debit.ok) {
        await recordPayable(admin, {
          accountType: "supplier",
          accountId: supplierId,
          orderId: order.id,
          amount: costAmount,
        });
      } else {
        await admin.from("orders").update({ credit_status: "awaiting_merchant_credits" }).eq("id", order.id);
      }
    } else {
      // COD: the supplier collects the cash directly at delivery and keeps
      // it, so EcomStrait deducts the merchant's margin + the platform fee
      // from the supplier's wallet up front, as a guarantee.
      const debit = await debitWallet(admin, marginAmount + feeAmount, {
        accountType: "supplier",
        accountId: supplierId,
        kind: "order_deduction",
        orderId: order.id,
        note: `Order ${order.id}: merchant margin + platform fee`,
      });
      if (debit.ok) {
        if (store?.user_id) {
          await recordPayable(admin, {
            accountType: "merchant",
            accountId: store.user_id,
            orderId: order.id,
            amount: marginAmount,
          });
        } else {
          // The supplier's wallet was already debited — this order's margin
          // is money someone is now owed with no resolvable merchant to owe
          // it to. Shouldn't happen (storeId is a real FK); surfacing loudly
          // rather than swallowing it, since real money already moved.
          console.error(
            `[order-sink] order ${order.id}: debited supplier ${supplierId} for margin ${marginAmount} but store ${opts.storeId} has no resolvable owner — payable not recorded`,
          );
        }
      } else {
        await admin.from("orders").update({ credit_status: "awaiting_supplier_credits" }).eq("id", order.id);
        await notifySupplierOrdersWaiting(admin, supplierId);
      }
    }
  }

  // Two-way inventory: decrement supplier stock for matched products. Runs
  // regardless of credit_status — a held order still reserves the stock it
  // was placed against; only supplier visibility is what's gated.
  if (productIds.length) {
    for (const i of opts.items) {
      const p = productById.get(i.product_id ?? "");
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
