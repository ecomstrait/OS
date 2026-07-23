import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { PLAN_ENTITLEMENTS } from "@ecomstrait/db";
import { ensureSubscription, reconcileSubscription, effectivePlan, inPromoTrial } from "@/lib/subscription";
import { BillingPlans } from "@/components/billing/billing-plans";

export const metadata: Metadata = { title: "Billing" };

function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default async function BillingPage() {
  await ensureSubscription();
  // Pull the latest state from Stripe (used instead of a webhook).
  await reconcileSubscription();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  const plan = effectivePlan(sub);
  const promo = inPromoTrial(sub);
  const row = sub;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Billing</h1>
      <p className="mt-1 text-sm text-ink-500">
        You&apos;re on the <span className="font-semibold text-ink-800">{PLAN_ENTITLEMENTS[plan].label}</span> plan.
      </p>

      {promo && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ai-100 bg-ai-50/60 p-4">
          <Sparkles className="h-5 w-5 shrink-0 text-ai-600" />
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-950">Founders promo active</span> — all Full features
            free for {daysLeft(sub?.trial_ends_at ?? null)} more days. Add a plan any time to continue after.
          </p>
        </div>
      )}

      <div className="mt-6">
        <BillingPlans currentPlan={plan} hasCustomer={Boolean(row?.stripe_customer_id)} />
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Payments are handled securely by Stripe. Prices are billed monthly and you can cancel anytime.
      </p>
    </div>
  );
}
