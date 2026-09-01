"use server";

import { getStripe, supplierUrl } from "@/lib/stripe";
import { getSupplierContext } from "@/lib/supplier-context";

/**
 * Creates a Stripe Checkout session that credits the caller's supplier
 * wallet once it completes (Docs/Credits-Settlement-Plan.md). Crediting
 * itself happens in the Stripe webhook (checkout.session.completed,
 * metadata.purpose === "wallet_topup"), not here.
 */
export async function createWalletTopupSession(amount: number): Promise<{ url?: string; error?: string }> {
  if (!Number.isFinite(amount) || amount < 1) {
    return { error: "Enter an amount of at least $1." };
  }

  const stripe = getStripe();
  if (!stripe) return { error: "Wallet top-up isn't available right now." };

  const ctx = await getSupplierContext();
  if ("error" in ctx) return ctx;

  const base = supplierUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: "EcomStrait wallet top-up" },
          unit_amount: Math.round(amount * 100),
        },
      },
    ],
    success_url: `${base}/wallet?topup=success`,
    cancel_url: `${base}/wallet?topup=cancelled`,
    metadata: { purpose: "wallet_topup", account_type: "supplier", supplier_id: ctx.supplierId },
  });

  return { url: session.url ?? undefined };
}
