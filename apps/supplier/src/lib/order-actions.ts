"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@ecomstrait/db/types";
import { getSupplierContext } from "@/lib/supplier-context";
import { sendStoreOwnerEmail, escapeHtml } from "@/lib/notify";

/** Advance an order through its fulfilment lifecycle (and email the customer). */
export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const ctx = await getSupplierContext();
  if ("error" in ctx) return ctx;

  const { data: order } = await ctx.supabase
    .from("orders")
    .select("id, number, customer_email")
    .eq("id", orderId)
    .eq("supplier_id", ctx.supplierId)
    .maybeSingle();
  if (!order) return { error: "Order not found." };

  const { error } = await ctx.supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };

  // Docs/Credits-Settlement-Plan.md: a COD order's margin+fee was already
  // deducted from this supplier's wallet up front. If it never delivers,
  // reverse that — a no-op for anything not an already-deducted COD order,
  // so this is safe to call on every cancellation unconditionally.
  if (status === "cancelled") {
    await ctx.supabase.rpc("reverse_cod_deduction", { p_order_id: orderId });
  }

  if (order.customer_email) {
    await sendStoreOwnerEmail({
      to: order.customer_email,
      subject: `Order #${order.number} is ${status}`,
      html: `<p>Your order <strong>#${order.number}</strong> is now <strong>${escapeHtml(status)}</strong>.</p>`,
    });
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return {};
}
