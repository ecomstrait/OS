"use server";

import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { creditWallet, releaseHeldOrders } from "@ecomstrait/db/wallet";
import { getStripe, merchantUrl } from "@/lib/stripe";

/**
 * Creates a Stripe Checkout session that credits the caller's merchant
 * wallet once it completes (Docs/Credits-Settlement-Plan.md). Crediting
 * itself happens in the Stripe webhook (checkout.session.completed,
 * metadata.purpose === "wallet_topup"), not here — this action never
 * touches the wallet directly.
 */
export async function createWalletTopupSession(amount: number): Promise<{ url?: string; error?: string }> {
  if (!Number.isFinite(amount) || amount < 1) {
    return { error: "Enter an amount of at least $1." };
  }

  const stripe = getStripe();
  if (!stripe) return { error: "Wallet top-up isn't available right now." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const base = merchantUrl();
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
    metadata: { purpose: "wallet_topup", account_type: "merchant", user_id: user.id },
  });

  return { url: session.url ?? undefined };
}

/**
 * Self-heal fallback for the wallet top-up flow (mirrors reconcileSubscription
 * in subscription.ts): a Checkout session completing and the Stripe webhook
 * firing are two independent things, so landing back on /wallet after a
 * successful payment doesn't guarantee `checkout.session.completed` actually
 * reached and was applied by /api/stripe/webhook (missing/misconfigured
 * STRIPE_WEBHOOK_SECRET, a failed delivery, etc). Called from the wallet page
 * whenever it loads with ?topup=success&session_id=..., verifying payment
 * directly with Stripe. Idempotent against the webhook via `externalRef` —
 * wallet_adjust's unique index guarantees this session is credited at most
 * once no matter which of the two runs first, or whether they race.
 */
export async function reconcileWalletTopup(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const stripe = getStripe();
  if (!stripe) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  if (!admin) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (
    !session ||
    session.payment_status !== "paid" ||
    session.metadata?.purpose !== "wallet_topup" ||
    session.metadata.user_id !== user.id ||
    !session.amount_total
  ) {
    return;
  }

  await creditWallet(admin, session.amount_total / 100, {
    accountType: "merchant",
    accountId: user.id,
    kind: "topup",
    note: `Stripe checkout ${session.id}`,
    externalRef: session.id,
  });
  await releaseHeldOrders(admin, "merchant", user.id);
}
