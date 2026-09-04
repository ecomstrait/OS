import type { Metadata } from "next";
import { Wallet as WalletIcon, Clock, HandCoins, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { createClient } from "@ecomstrait/auth/server";
import type { WalletTransactionKind } from "@ecomstrait/db";
import { getMySupplier } from "@/lib/supplier-context";
import { WalletTopupForm } from "@/components/wallet/topup-form";
import { reconcileWalletTopup } from "@/lib/wallet-actions";

export const metadata: Metadata = { title: "Wallet" };

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const KIND_LABEL: Record<WalletTransactionKind, string> = {
  topup: "Top-up",
  order_deduction: "Order deduction",
  order_credit: "Order credit",
  reversal: "Refund",
  settlement_payout: "Settlement payout",
};
const KIND_STYLE: Record<WalletTransactionKind, string> = {
  topup: "bg-brand-50 text-brand-700",
  order_deduction: "bg-ink-100 text-ink-500",
  order_credit: "bg-brand-50 text-brand-700",
  reversal: "bg-amber-50 text-amber-700",
  settlement_payout: "bg-brand-50 text-brand-700",
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; session_id?: string }>;
}) {
  const { topup, session_id } = await searchParams;
  if (topup === "success" && session_id) {
    // Best-effort: if the Stripe webhook already credited this session this
    // is a no-op, and the page must still render even if Stripe can't be
    // reached right now.
    await reconcileWalletTopup(session_id).catch(() => {});
  }

  const supabase = await createClient();
  const my = await getMySupplier();

  const { data: wallet } = my
    ? await supabase.from("supplier_wallets").select("balance").eq("supplier_id", my.supplierId).maybeSingle()
    : { data: null };
  const balance = wallet?.balance ?? 0;

  // Pending payout (Docs/Credits-Settlement-Plan.md §4): what EcomStrait now
  // owes this supplier — their cost on prepaid orders already realized —
  // that hasn't gone out in a settlement batch yet. Separate from the
  // balance above, which is pre-funded money waiting to be spent, not money
  // owed.
  const { data: pendingRows } = my
    ? await supabase
        .from("payable_ledger")
        .select("amount")
        .eq("account_type", "supplier")
        .eq("account_id", my.supplierId)
        .eq("status", "pending")
    : { data: [] };
  const pendingPayout = (pendingRows ?? []).reduce((s, p) => s + p.amount, 0);

  // Transaction ledger — the append-only record of everything that's moved
  // this wallet's balance (top-ups, order deductions, refunds).
  const { data: transactions } = my
    ? await supabase
        .from("wallet_transactions")
        .select("id, kind, amount, balance_after, note, order_id, created_at")
        .eq("account_type", "supplier")
        .eq("account_id", my.supplierId)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };
  const txns = transactions ?? [];

  // Held orders (Docs/Credits-Settlement-Plan.md): a COD order this wallet
  // couldn't cover the merchant's margin + platform fee for up front, so it
  // wasn't sent through — it stays invisible on /orders until a top-up
  // releases it.
  const { data: held } = my
    ? await supabase
        .from("orders")
        .select("id, number, store_name, margin_amount, platform_fee_amount, created_at")
        .eq("supplier_id", my.supplierId)
        .eq("credit_status", "awaiting_supplier_credits")
        .order("created_at", { ascending: true })
    : { data: [] };
  const heldList = held ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-950">Wallet</h1>
      <p className="mt-1 text-sm text-ink-500">
        Covers each Cash on Delivery order&apos;s merchant margin plus the EcomStrait platform fee,
        deducted up front — you keep the cash you collect at delivery.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <WalletIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs text-ink-500">Current balance</p>
            <p className="text-2xl font-bold text-ink-950">{money(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <HandCoins className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs text-ink-500">Pending payout</p>
            <p className="text-2xl font-bold text-ink-950">{money(pendingPayout)}</p>
            <p className="text-[11px] text-ink-400">Owed by EcomStrait — next settlement</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-800">Add credits</h2>
        <div className="mt-3">
          <WalletTopupForm />
        </div>
      </div>

      {heldList.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-ink-800">
              {heldList.length} COD order{heldList.length === 1 ? "" : "s"} waiting
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            Your balance doesn&apos;t cover these yet, so they haven&apos;t come through. Add credits
            above to receive them.
          </p>
          <ul className="mt-4 divide-y divide-amber-100">
            {heldList.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-700">
                  Order #{o.number} — {o.store_name ?? "Store"} · {when(o.created_at)}
                </span>
                <span className="font-medium text-ink-900">
                  {money((o.margin_amount ?? 0) + (o.platform_fee_amount ?? 0))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-800">Transaction history</h2>
        {txns.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Nothing yet — top-ups and order deductions will show up here.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-2.5 pr-4 text-ink-500">{when(t.created_at)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", KIND_STYLE[t.kind])}>
                        {KIND_LABEL[t.kind]}
                      </span>
                    </td>
                    <td className="max-w-[16rem] truncate py-2.5 pr-4 text-ink-500" title={t.note ?? undefined}>
                      {t.note ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-4 text-right font-semibold",
                        t.amount >= 0 ? "text-brand-700" : "text-ink-900",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {t.amount >= 0 ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-ink-400" />
                        )}
                        {t.amount >= 0 ? "+" : "−"}
                        {money(Math.abs(t.amount))}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-ink-500">{money(t.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
