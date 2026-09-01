import type { Metadata } from "next";
import { Wallet as WalletIcon, Clock } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
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
    </div>
  );
}
