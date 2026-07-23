import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles, Store, Coins, CreditCard } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { PLAN_ENTITLEMENTS } from "@ecomstrait/db";
import { getEntitlements } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Overview" };

function fmt(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.full_name as string)?.split(" ")[0];

  const e = await getEntitlements();
  const plan = PLAN_ENTITLEMENTS[e.plan];
  const isFree = e.plan === "free";
  const tokensUsed = e.tokensUsed;
  const storeCount = e.storesUsed;
  const tokenPct = Math.min(100, Math.round((tokensUsed / e.tokensPerDay) * 100));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Welcome{name ? `, ${name}` : ""} 👋</h1>
      <p className="mt-1 text-sm text-ink-500">Your AI co-founder is ready. Let&apos;s build your store.</p>

      {isFree && (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ai-100 bg-ai-50/60 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-ai-600" />
            <div>
              <p className="text-sm font-semibold text-ink-950">Upgrade for more AI tokens & stores</p>
              <p className="text-sm text-ink-500">You&apos;re on the Free plan — upgrade any time.</p>
            </div>
          </div>
          <Link href="/billing" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ai-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ai-600">
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Meters */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-400">Plan</span>
            <Sparkles className="h-4 w-4 text-ink-300" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-950">{plan.label}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-400">AI tokens today</span>
            <Coins className="h-4 w-4 text-ink-300" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-950">
            {fmt(tokensUsed)}
            <span className="text-sm font-medium text-ink-300"> / {fmt(plan.tokensPerDay)}</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${tokenPct}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-400">Stores</span>
            <Store className="h-4 w-4 text-ink-300" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-950">
            {storeCount ?? 0}
            <span className="text-sm font-medium text-ink-300"> / {plan.storeLimit}</span>
          </p>
        </div>
      </div>

      {/* Build CTA */}
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-base font-semibold text-ink-950">Build your first store</p>
          <p className="text-sm text-ink-500">Describe your idea and watch EcomAI build it.</p>
        </div>
        <Link href="/builder" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
          <Sparkles className="h-4 w-4" /> Open Store Builder
        </Link>
      </div>
    </div>
  );
}
