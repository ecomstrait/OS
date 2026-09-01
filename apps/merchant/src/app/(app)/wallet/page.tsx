import type { Metadata } from "next";
import { Wallet as WalletIcon, Clock } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { getWalletBalance } from "@ecomstrait/db/wallet";
import { WalletTopupForm } from "@/components/wallet/topup-form";

export const metadata: Metadata = { title: "Wallet" };

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const balance = admin && user ? await getWalletBalance(admin, "merchant", user.id) : 0;

  // Held orders (Docs/Credits-Settlement-Plan.md): a prepaid order this
  // wallet couldn't cover, still parked in `orders` and invisible to its
  // supplier until a top-up releases it. `orders` has no merchant-facing RLS
  // policy (it's scoped to suppliers), so this reads via the admin client,
  // explicitly filtered to stores this signed-in user actually owns.
  let held: { id: string; number: number; store_name: string | null; cost_amount: number | null; platform_fee_amount: number | null; created_at: string }[] = [];
  if (admin && user) {
    const { data: stores } = await admin.from("stores").select("id").eq("user_id", user.id);
    const storeIds = (stores ?? []).map((s) => s.id);
    if (storeIds.length) {
      const { data } = await admin
        .from("orders")
        .select("id, number, store_name, cost_amount, platform_fee_amount, created_at")
        .in("store_id", storeIds)
        .eq("credit_status", "awaiting_merchant_credits")
        .order("created_at", { ascending: true });
      held = data ?? [];
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-950">Wallet</h1>
      <p className="mt-1 text-sm text-ink-500">
        Covers what you owe suppliers on each sale — their cost plus the EcomStrait platform fee.
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <WalletIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs text-ink-500">Current balance</p>
          <p className="text-2xl font-bold text-ink-950">{money(balance)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-800">Add credits</h2>
        <div className="mt-3">
          <WalletTopupForm />
        </div>
      </div>

      {held.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-ink-800">
              {held.length} order{held.length === 1 ? "" : "s"} — unpaid / low credits
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            Your balance doesn&apos;t cover these yet, so they haven&apos;t been sent to their
            suppliers. Add credits above to release them.
          </p>
          <ul className="mt-4 divide-y divide-amber-100">
            {held.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-700">
                  Order #{o.number} — {o.store_name ?? "Store"} · {when(o.created_at)}
                </span>
                <span className="font-medium text-ink-900">
                  {money((o.cost_amount ?? 0) + (o.platform_fee_amount ?? 0))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
