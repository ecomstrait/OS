import type { Metadata } from "next";
import { BarChart3, ClipboardList, CheckCircle2, Timer } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { PendingGate } from "@/components/app/pending-gate";
import { RequestsTrend, CategoryBar } from "@/components/analytics/charts";
import { getSupplierAnalytics } from "@/lib/analytics-data";
import { REQUEST_STATUS_STYLE } from "@/lib/request-status";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const my = await getMySupplier();

  const { data: supplier } = my
    ? await supabase.from("suppliers").select("*").eq("id", my.supplierId).maybeSingle()
    : { data: null };

  if (!supplier || supplier.status !== "approved") {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ink-950">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500">Insights into your catalog, requests, and quality.</p>
        <div className="mt-6">
          <PendingGate status={supplier?.status ?? null} feature="analytics" />
        </div>
      </div>
    );
  }

  const a = await getSupplierAnalytics(supabase, supplier);

  // Persist the freshest quality score (owner only; best-effort; when changed).
  if (my?.isOwner && a.quality.score !== supplier.quality_score) {
    await supabase.from("suppliers").update({ quality_score: a.quality.score }).eq("id", supplier.id);
  }

  const tiles = [
    { label: "Quality score", value: `${a.quality.score}`, sub: a.quality.tier, icon: BarChart3 },
    { label: "Open requests", value: `${a.metrics.openRequests}`, sub: `${a.metrics.totalRequests} total`, icon: ClipboardList },
    { label: "Acceptance rate", value: a.metrics.acceptanceRate != null ? `${a.metrics.acceptanceRate}%` : "—", sub: "of responded", icon: CheckCircle2 },
    { label: "Avg. response", value: a.metrics.avgResponseHours != null ? `${a.metrics.avgResponseHours}h` : "—", sub: "to first action", icon: Timer },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Analytics</h1>
      <p className="mt-1 text-sm text-ink-500">Insights into your catalog, requests, and quality.</p>

      {/* Metric tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-400">{t.label}</span>
              <t.icon className="h-4 w-4 text-ink-300" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-950">{t.value}</p>
            <p className="text-xs text-ink-400">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Requests trend */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-950">Requests · last 14 days</h2>
          <div className="mt-3">
            <RequestsTrend data={a.requestsByDay} />
          </div>
        </div>

        {/* Quality breakdown */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink-950">Quality score</h2>
            <span className="text-sm font-semibold text-brand-600">{a.quality.tier}</span>
          </div>
          <p className="mt-1 text-4xl font-bold text-ink-950">
            {a.quality.score}
            <span className="text-lg font-medium text-ink-300">/100</span>
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {a.quality.factors.map((f) => (
              <li key={f.label}>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-600">{f.label}</span>
                  <span className="text-ink-400">
                    {f.earned}/{f.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(f.earned / f.max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-950">Requests by status</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {a.statusCounts.map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${REQUEST_STATUS_STYLE[s.status]}`}>
                  {s.status}
                </span>
                <span className="font-medium text-ink-700">{s.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-50 pt-4 text-center">
            <div>
              <p className="text-lg font-bold text-brand-600">{a.inventory.inStock}</p>
              <p className="text-xs text-ink-400">In stock</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{a.inventory.low}</p>
              <p className="text-xs text-ink-400">Low</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{a.inventory.out}</p>
              <p className="text-xs text-ink-400">Out</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-950">Published products by category</h2>
          <div className="mt-3">
            {a.categoryCounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">Publish products to see categories.</p>
            ) : (
              <CategoryBar data={a.categoryCounts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
