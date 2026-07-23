"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { PLAN_ENTITLEMENTS, PLAN_ORDER } from "@ecomstrait/db";
import type { PlanTier } from "@ecomstrait/db";
import { createCheckoutSession, createPortalSession } from "@/lib/billing-actions";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

export function BillingPlans({
  currentPlan,
  hasCustomer,
}: {
  currentPlan: PlanTier;
  hasCustomer: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function subscribe(plan: Exclude<PlanTier, "free">) {
    setError(null);
    setPending(plan);
    start(async () => {
      const res = await createCheckoutSession(plan);
      if (res.error) {
        setError(res.error);
        setPending(null);
      } else if (res.url) {
        window.location.href = res.url;
      }
    });
  }

  function manage() {
    setError(null);
    setPending("portal");
    start(async () => {
      const res = await createPortalSession();
      if (res.error) {
        setError(res.error);
        setPending(null);
      } else if (res.url) {
        window.location.href = res.url;
      }
    });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const p = PLAN_ENTITLEMENTS[tier];
          const isCurrent = tier === currentPlan;
          return (
            <div
              key={tier}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5",
                isCurrent ? "border-brand-400 ring-1 ring-brand-400" : "border-ink-100",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink-950">{p.label}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-ink-950">
                ${p.priceMonthly}
                <span className="text-sm font-medium text-ink-400">/mo</span>
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-ink-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-600" /> {fmt(p.tokensPerDay)} AI tokens/day
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-600" /> {p.storeLimit} store{p.storeLimit === 1 ? "" : "s"}
                </li>
              </ul>
              <div className="mt-5">
                {tier === "free" ? (
                  <span className="block text-center text-xs text-ink-400">
                    {isCurrent ? "Your plan" : "Downgrade in the billing portal"}
                  </span>
                ) : isCurrent ? (
                  <button
                    onClick={manage}
                    disabled={pending !== null}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-sm font-semibold text-ink-800 hover:bg-ink-50 disabled:opacity-50"
                  >
                    {pending === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
                  </button>
                ) : (
                  <button
                    onClick={() => subscribe(tier as Exclude<PlanTier, "free">)}
                    disabled={pending !== null}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {pending === tier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasCustomer && (
        <div className="mt-4">
          <button onClick={manage} disabled={pending !== null} className="text-sm font-semibold text-brand-600 hover:underline disabled:opacity-50">
            Manage billing & invoices →
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
