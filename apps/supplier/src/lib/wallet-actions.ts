"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@ecomstrait/db";
import { creditWallet, releaseHeldOrders, earmarkPayablesForPayout } from "@ecomstrait/db/wallet";
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

/**
 * Withdraw request: the supplier picks an amount (up to their current
 * pending payable balance) and gives a bank account. An admin processes it
 * manually by bank transfer — outside this app — and uploads a receipt once
 * done (see the merchant app's settlement-actions.ts markPayoutRequestPaid).
 * Doesn't move money itself. Refuses a second open request while one is
 * already pending, and refuses an amount over what's actually owed.
 *
 * The specific `payable_ledger` rows being cashed out (oldest first, up to
 * the requested amount) are locked to this request right here — not just a
 * number on the payout_requests row — so "Pending payout" on the wallet page
 * actually drops once it's paid, and the same money can't also get swept
 * into a separate weekly settlement batch in the meantime. Each row is tied
 * to one order, so the amount actually withdrawn can end up a little more
 * than what was typed (whatever fully covers it) — the returned `amount` is
 * the real figure to show back.
 */
export async function requestPayout(input: {
  amount: number;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankRoutingCode?: string;
  note?: string;
}): Promise<{ error?: string; amount?: number }> {
  const ctx = await getSupplierContext();
  if ("error" in ctx) return ctx;

  const requested = Number(input.amount);
  if (!Number.isFinite(requested) || requested <= 0) return { error: "Enter a withdrawal amount." };

  const bankAccountName = input.bankAccountName.trim();
  const bankName = input.bankName.trim();
  const bankAccountNumber = input.bankAccountNumber.trim();
  if (!bankAccountName || !bankName || !bankAccountNumber) {
    return { error: "Account holder name, bank name, and account number are all required." };
  }

  const { data: existing } = await ctx.supabase
    .from("payout_requests")
    .select("id")
    .eq("account_type", "supplier")
    .eq("account_id", ctx.supplierId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { error: "You already have a withdrawal request pending review." };

  // Only pending, not-already-held rows are up for grabs — an admin hold or
  // another open request has first claim on the rest.
  const { data: available } = await ctx.supabase
    .from("payable_ledger")
    .select("id, amount")
    .eq("account_type", "supplier")
    .eq("account_id", ctx.supplierId)
    .eq("status", "pending")
    .eq("held", false)
    .order("created_at", { ascending: true });
  const rows = available ?? [];
  const availableTotal = rows.reduce((s, r) => s + r.amount, 0);
  if (availableTotal <= 0) return { error: "Nothing pending to withdraw yet." };
  if (requested > availableTotal) return { error: `You can withdraw up to $${availableTotal.toFixed(2)}.` };

  const earmarkIds: string[] = [];
  let covered = 0;
  for (const row of rows) {
    if (covered >= requested) break;
    earmarkIds.push(row.id);
    covered += row.amount;
  }

  const { data: inserted, error } = await ctx.supabase
    .from("payout_requests")
    .insert({
      account_type: "supplier",
      account_id: ctx.supplierId,
      amount: covered,
      bank_account_name: bankAccountName,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_routing_code: input.bankRoutingCode?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "Couldn't submit the request." };

  const admin = createAdminClient();
  if (!admin) return { error: "Database isn't configured." };
  await earmarkPayablesForPayout(admin, earmarkIds, inserted.id);

  revalidatePath("/wallet");
  return { amount: covered };
}
