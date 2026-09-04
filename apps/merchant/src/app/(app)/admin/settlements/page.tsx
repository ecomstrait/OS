import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import { RunSettlementButton } from "@/components/admin/run-settlement-button";
import { HoldReleaseButton } from "@/components/admin/hold-release-button";
import { PayoutRequestReview } from "@/components/admin/payout-request-review";

export const metadata: Metadata = { title: "Settlements" };

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Weekly settlement batches (Docs/Credits-Settlement-Plan.md, §4). Manual MVP
 * per §1 open decision #3: this lists what each run totaled and lets an
 * admin mark it paid once they've sent the money by bank transfer — there's
 * no automated payout rail yet. The weekly run itself is scheduled via
 * `apps/merchant/vercel.json` (Vercel Cron -> `/api/cron/settlement`,
 * authenticated by `CRON_SECRET`, every Monday); "Run settlement now" below
 * calls the exact same batching logic on demand.
 */
export default async function SettlementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const [{ data: batches }, { data: pendingLedger }, { data: requests }] = await Promise.all([
    supabase.from("settlement_batches").select("*").order("run_at", { ascending: false }),
    supabase.from("payable_ledger").select("account_type, account_id, amount, held").eq("status", "pending"),
    supabase
      .from("payout_requests")
      .select(
        "id, account_type, account_id, amount, note, bank_account_name, bank_name, bank_account_number, bank_routing_code, requested_at",
      )
      .eq("status", "pending")
      .order("requested_at", { ascending: true }),
  ]);

  const list = batches ?? [];
  const ledgerRows = pendingLedger ?? [];
  const requestList = requests ?? [];

  // Group pending payables by account — an admin thinks in terms of "this
  // supplier's balance", not individual order-level rows.
  const byAccount = new Map<string, { accountType: "merchant" | "supplier"; accountId: string; total: number; held: boolean }>();
  for (const row of ledgerRows) {
    const key = `${row.account_type}:${row.account_id}`;
    const existing = byAccount.get(key);
    if (existing) {
      existing.total += row.amount;
      // Flag as held if ANY pending row for this account is held — never
      // silently hide an active hold just because a newer, still-unheld
      // payable also came in for the same account. "Release" clears every
      // pending row regardless, so this can't get stuck.
      existing.held = existing.held || row.held;
    } else {
      byAccount.set(key, { accountType: row.account_type, accountId: row.account_id, total: row.amount, held: row.held });
    }
  }
  const accountRows = [...byAccount.values()].sort((a, b) => b.total - a.total);

  // Human-readable names for the accounts above and for the payout requests.
  const allAccounts = [
    ...accountRows.map((r) => ({ accountType: r.accountType, accountId: r.accountId })),
    ...requestList.map((r) => ({ accountType: r.account_type, accountId: r.account_id })),
  ];
  const merchantIds = [...new Set(allAccounts.filter((r) => r.accountType === "merchant").map((r) => r.accountId))];
  const supplierIds = [...new Set(allAccounts.filter((r) => r.accountType === "supplier").map((r) => r.accountId))];
  const [{ data: profiles }, { data: suppliers }] = await Promise.all([
    merchantIds.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", merchantIds) : Promise.resolve({ data: [] }),
    supplierIds.length ? supabase.from("suppliers").select("id, business_name").in("id", supplierIds) : Promise.resolve({ data: [] }),
  ]);
  const nameByMerchant = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
  const nameBySupplier = new Map((suppliers ?? []).map((s) => [s.id, s.business_name]));
  const nameFor = (accountType: "merchant" | "supplier", accountId: string) =>
    (accountType === "merchant" ? nameByMerchant.get(accountId) : nameBySupplier.get(accountId)) || accountId;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Settlements</h1>
          <p className="mt-1 text-sm text-ink-500">
            Weekly batches of what EcomStrait owes merchants and suppliers. Pay by bank transfer, then
            mark the batch paid.
          </p>
        </div>
        <RunSettlementButton />
      </div>

      {/* Withdrawal requests — a merchant/supplier asking to cash out, with the bank account to pay */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-800">Withdrawal requests</h2>
        </div>
        {requestList.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No open requests.</p>
        ) : (
          <ul className="divide-y divide-ink-50">
            {requestList.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {nameFor(r.account_type, r.account_id)}{" "}
                    <span className="font-normal capitalize text-ink-400">({r.account_type})</span>
                  </p>
                  <p className="text-sm font-semibold text-ink-900">{money(r.amount)}</p>
                </div>
                <p className="text-xs text-ink-400">Requested {when(r.requested_at)}</p>
                {r.note && <p className="mt-1 text-xs text-ink-600">&ldquo;{r.note}&rdquo;</p>}
                <div className="mt-3">
                  <PayoutRequestReview
                    requestId={r.id}
                    bankAccountName={r.bank_account_name}
                    bankName={r.bank_name}
                    bankAccountNumber={r.bank_account_number}
                    bankRoutingCode={r.bank_routing_code}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending balances by account — hold one out of the next settlement run, or release a hold */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-800">Pending payables</h2>
        </div>
        {accountRows.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">Nothing pending right now.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accountRows.map((a) => (
                <tr key={`${a.accountType}:${a.accountId}`} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 text-ink-700">{nameFor(a.accountType, a.accountId)}</td>
                  <td className="px-4 py-3 capitalize text-ink-500">{a.accountType}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">{money(a.total)}</td>
                  <td className="px-4 py-3">
                    {a.held ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">On hold</span>
                    ) : (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Eligible</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <HoldReleaseButton accountType={a.accountType} accountId={a.accountId} held={a.held} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Past batches */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-800">Batches</h2>
        </div>
        {list.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No settlement batches yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 text-right font-medium">To merchants</th>
                <th className="px-4 py-3 text-right font-medium">To suppliers</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 text-ink-700">
                    {when(b.period_start)} – {when(b.period_end)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">
                    {money(b.total_to_merchants)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">
                    {money(b.total_to_suppliers)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        b.status === "paid"
                          ? "rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === "draft" && <MarkPaidButton batchId={b.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
