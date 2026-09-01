import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { SUPPLIER_PLAN_ENTITLEMENTS } from "@ecomstrait/db";
import { getMySupplier } from "@/lib/supplier-context";
import { PendingGate } from "@/components/app/pending-gate";
import { ensureSupplierSubscription, reconcileSupplierSubscription, effectivePlan } from "@/lib/subscription";
import { SupplierBillingPlans } from "@/components/billing/supplier-billing-plans";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = await createClient();
  const my = await getMySupplier();

  const { data: supplier } = my
    ? await supabase.from("suppliers").select("status").eq("id", my.supplierId).maybeSingle()
    : { data: null };

  if (!supplier || supplier.status !== "approved") {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ink-950">Billing</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your plan, AI tokens, and catalog limits.</p>
        <div className="mt-6">
          <PendingGate status={supplier?.status ?? null} feature="billing" />
        </div>
      </div>
    );
  }

  await ensureSupplierSubscription();
  // Pull the latest state from Stripe (used instead of a webhook).
  await reconcileSupplierSubscription();

  const { data: sub } = await supabase
    .from("supplier_subscriptions")
    .select("*")
    .eq("supplier_id", my!.supplierId)
    .maybeSingle();

  const plan = effectivePlan(sub);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Billing</h1>
      <p className="mt-1 text-sm text-ink-500">
        You&apos;re on the{" "}
        <span className="font-semibold text-ink-800">{SUPPLIER_PLAN_ENTITLEMENTS[plan].label}</span> plan.
      </p>

      <div className="mt-6">
        <SupplierBillingPlans currentPlan={plan} hasCustomer={Boolean(sub?.stripe_customer_id)} />
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Payments are handled securely by Stripe. Prices are billed monthly and you can cancel anytime.
      </p>
    </div>
  );
}
