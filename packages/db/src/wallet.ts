import { createAdminClient } from "./admin";
import type { WalletAccountType, WalletTransactionKind } from "./types";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Merchant & supplier wallets (Docs/Credits-Settlement-Plan.md).
 *
 * Shared here (not app-local) because both apps/merchant and apps/supplier
 * need it: a prepaid order debits the merchant's wallet from the merchant
 * app's order pipeline, a COD order debits the supplier's wallet from the
 * same pipeline, and each app's own Stripe top-up webhook credits its own
 * side's wallet.
 *
 * Every balance change goes through `public.wallet_adjust()` (the Postgres
 * function in `supabase/migrations/20260829160000_wallets.sql`), never a
 * direct table write — it's the one place that atomically checks a debit
 * against the current balance and writes the matching `wallet_transactions`
 * ledger row in the same statement, so two concurrent orders against a
 * balance that only covers one can't both succeed.
 */

/**
 * Basis points (1/100th of a percent): 5bps = 0.05%. Named per the plan
 * ("0.05% for now... treat it as a named constant, not a hardcoded literal,
 * since it's explicitly 'for the time'"). Applied to a supplier-order's
 * subtotal per §1 open decision #1's default — flag if that base changes.
 */
export const ECOMSTRAIT_FEE_BPS = 5;

/** EcomStrait's cut of one supplier-order's subtotal, rounded to cents. */
export function platformFee(subtotal: number): number {
  return Math.round(subtotal * (ECOMSTRAIT_FEE_BPS / 10000) * 100) / 100;
}

export type WalletDebitResult = { ok: true; balance: number } | { ok: false; error: string };

type AdjustParams = {
  accountType: WalletAccountType;
  accountId: string;
  kind: WalletTransactionKind;
  orderId?: string | null;
  note?: string | null;
  /**
   * Idempotency key for this real-world event (e.g. a Stripe checkout
   * session id). `wallet_adjust` enforces uniqueness on this at the DB
   * layer — a second call with the same `externalRef` is a guaranteed
   * no-op, not just an unlikely race. Required for any caller that a
   * duplicate delivery or a racing fallback path could invoke twice for
   * the same event (e.g. wallet top-ups); omit only when the caller
   * already has its own exactly-once guarantee (e.g. per-order debits,
   * gated by `orders.credit_status`).
   */
  externalRef?: string | null;
};

/**
 * Debit `amount` (a positive number) from a wallet. Fails **closed**: any
 * error talking to the database is treated as insufficient balance, not as
 * success — an order must never be let through un-debited because the check
 * itself failed. Returns the resulting balance on success.
 */
export async function debitWallet(
  admin: Admin,
  amount: number,
  params: AdjustParams,
): Promise<WalletDebitResult> {
  if (amount <= 0) {
    return { ok: true, balance: await getWalletBalance(admin, params.accountType, params.accountId) };
  }

  const { data, error } = await admin.rpc("wallet_adjust", {
    p_account_type: params.accountType,
    p_account_id: params.accountId,
    p_amount: -amount,
    p_kind: params.kind,
    p_order_id: params.orderId ?? null,
    p_note: params.note ?? null,
    p_external_ref: params.externalRef ?? null,
  });

  if (error) {
    console.error("[wallet] debit failed:", error);
    return { ok: false, error: "Couldn't verify wallet balance." };
  }
  if (data === null) {
    return { ok: false, error: "Insufficient balance." };
  }
  return { ok: true, balance: Number(data) };
}

/**
 * Credit `amount` (a positive number) to a wallet — top-ups and reversals.
 * Unlike a debit this can't fail on balance (crediting only ever increases
 * it), so it throws on a genuine DB error rather than returning a result
 * type — callers are expected to be background/webhook paths that already
 * handle thrown errors, not a request path checking an ok/error union.
 */
export async function creditWallet(
  admin: Admin,
  amount: number,
  params: AdjustParams,
): Promise<number> {
  if (amount <= 0) return getWalletBalance(admin, params.accountType, params.accountId);

  const { data, error } = await admin.rpc("wallet_adjust", {
    p_account_type: params.accountType,
    p_account_id: params.accountId,
    p_amount: amount,
    p_kind: params.kind,
    p_order_id: params.orderId ?? null,
    p_note: params.note ?? null,
    p_external_ref: params.externalRef ?? null,
  });

  if (error) throw error;
  return Number(data);
}

/** Current balance for a merchant (`user_id`) or supplier (`supplier_id`) wallet. */
export async function getWalletBalance(
  admin: Admin,
  accountType: WalletAccountType,
  accountId: string,
): Promise<number> {
  if (accountType === "merchant") {
    const { data } = await admin
      .from("merchant_wallets")
      .select("balance")
      .eq("user_id", accountId)
      .maybeSingle();
    return data?.balance ?? 0;
  }
  const { data } = await admin
    .from("supplier_wallets")
    .select("balance")
    .eq("supplier_id", accountId)
    .maybeSingle();
  return data?.balance ?? 0;
}

/**
 * Record what EcomStrait now owes an account for one order — the supplier's
 * cost on a prepaid order, or the merchant's margin on a COD order. Feeds the
 * weekly settlement batch; deliberately separate from the wallet balance
 * above, which is pre-funded money waiting to be spent, not money owed back
 * out.
 */
export async function recordPayable(
  admin: Admin,
  params: { accountType: WalletAccountType; accountId: string; orderId: string; amount: number },
): Promise<void> {
  if (params.amount <= 0) return;
  const { error } = await admin.from("payable_ledger").insert({
    account_type: params.accountType,
    account_id: params.accountId,
    order_id: params.orderId,
    amount: params.amount,
  });
  if (error) throw error;
}

/**
 * After a top-up, retry the debit for every order this account still has on
 * hold, oldest first, stopping at the first one that still doesn't fit (the
 * rest won't either until another top-up lands).
 */
export async function releaseHeldOrders(
  admin: Admin,
  accountType: WalletAccountType,
  accountId: string,
): Promise<{ released: number }> {
  const holdStatus = accountType === "merchant" ? "awaiting_merchant_credits" : "awaiting_supplier_credits";

  let query = admin
    .from("orders")
    .select("id, supplier_id, store_id, cost_amount, margin_amount, platform_fee_amount")
    .eq("credit_status", holdStatus)
    .order("created_at", { ascending: true });

  if (accountType === "merchant") {
    // Balance is pooled per merchant (§1), so a top-up can release held
    // orders from any store that merchant owns, not just one.
    const { data: stores } = await admin.from("stores").select("id").eq("user_id", accountId);
    const storeIds = (stores ?? []).map((s) => s.id);
    if (storeIds.length === 0) return { released: 0 };
    query = query.in("store_id", storeIds);
  } else {
    query = query.eq("supplier_id", accountId);
  }

  const { data: held } = await query;
  if (!held || held.length === 0) return { released: 0 };

  // A COD release needs each order's merchant (store_id -> stores.user_id)
  // to credit the right payable_ledger account; a prepaid release already
  // has it — accountId here already is the merchant's own user_id.
  const storeOwners = new Map<string, string>();
  if (accountType === "supplier") {
    const storeIds = [...new Set(held.map((o) => o.store_id).filter((id): id is string => Boolean(id)))];
    if (storeIds.length) {
      const { data: stores } = await admin.from("stores").select("id, user_id").in("id", storeIds);
      for (const s of stores ?? []) storeOwners.set(s.id, s.user_id);
    }
  }

  let released = 0;
  for (const order of held) {
    const amount =
      accountType === "merchant"
        ? (order.cost_amount ?? 0) + (order.platform_fee_amount ?? 0)
        : (order.margin_amount ?? 0) + (order.platform_fee_amount ?? 0);

    // The Stripe webhook and the wallet page's own reconciliation fallback
    // can both call releaseHeldOrders for the same account around the same
    // top-up — concurrently, or one retrying after a crash mid-loop. The
    // debit itself must not move real money twice for the same order:
    // `externalRef` makes a second call a guaranteed no-op (not just
    // unlikely), via wallet_adjust's unique index — same mechanism as the
    // top-up credit above.
    const debit = await debitWallet(admin, amount, {
      accountType,
      accountId,
      kind: "order_deduction",
      orderId: order.id,
      note: "Released on top-up",
      externalRef: `release:${order.id}`,
    });
    if (!debit.ok) break;

    // Claim this order before recording what's owed for it or counting it
    // released: the debit above is safe to repeat, but `recordPayable` is a
    // plain insert with no such guarantee, so it must run at most once. The
    // WHERE clause makes this an atomic compare-and-swap — of two callers
    // racing here for the same order, only one's UPDATE actually matches
    // (Postgres row locking serializes them against each other), so only
    // one proceeds past it.
    const { data: claimed } = await admin
      .from("orders")
      .update({ credit_status: "deducted" })
      .eq("id", order.id)
      .eq("credit_status", holdStatus)
      .select("id")
      .maybeSingle();
    if (!claimed) continue; // another caller already released this order

    if (accountType === "merchant") {
      await recordPayable(admin, {
        accountType: "supplier",
        accountId: order.supplier_id,
        orderId: order.id,
        amount: order.cost_amount ?? 0,
      });
    } else {
      const merchantUserId = order.store_id ? storeOwners.get(order.store_id) : undefined;
      if (merchantUserId) {
        await recordPayable(admin, {
          accountType: "merchant",
          accountId: merchantUserId,
          orderId: order.id,
          amount: order.margin_amount ?? 0,
        });
      }
    }

    released++;
  }

  return { released };
}
