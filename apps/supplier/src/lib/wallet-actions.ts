"use server";

import { createAdminClient } from "@ecomstrait/db";
import { creditWallet, releaseHeldOrders } from "@ecomstrait/db/wallet";
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
    success_url: `${base}/wallet?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/wallet?topup=cancelled`,
    metadata: { purpose: "wallet_topup", account_type: "supplier", supplier_id: ctx.supplierId },
  });

  return { url: session.url ?? undefined };
}

/**
 * Self-heal fallback for the wallet top-up flow (see the merchant app's
 * twin of this function): a Checkout session completing and the Stripe
 * webhook firing are two independent things, so landing back on /wallet
 * after a successful payment doesn't guarantee `checkout.session.completed`
 * actually reached and was applied by /api/stripe/webhook. Called from the
 * wallet page whenever it loads with ?topup=success&session_id=...,
 * verifying payment directly with Stripe. Idempotent against the webhook via
 * `externalRef` — wallet_adjust's unique index guarantees this session is
 * credited at most once no matter which of the two runs first, or whether
 * they race.
 */
export async function reconcileWalletTopup(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const stripe = getStripe();
  if (!stripe) return;

  const ctx = await getSupplierContext();
  if ("error" in ctx) return;

  const admin = createAdminClient();
  if (!admin) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (
    !session ||
    session.payment_status !== "paid" ||
    session.metadata?.purpose !== "wallet_topup" ||
    session.metadata.supplier_id !== ctx.supplierId ||
    !session.amount_total
  ) {
    return;
  }

  await creditWallet(admin, session.amount_total / 100, {
    accountType: "supplier",
    accountId: ctx.supplierId,
    kind: "topup",
    note: `Stripe checkout ${session.id}`,
    externalRef: session.id,
  });
  await releaseHeldOrders(admin, "supplier", ctx.supplierId);
}
