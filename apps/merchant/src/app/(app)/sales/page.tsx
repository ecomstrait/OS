import type { Metadata } from "next";
import { TrendingUp, DollarSign, ShoppingBag, Package, Receipt } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";

export const metadata: Metadata = { title: "Sales" };

function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COUNTED = new Set(["paid", "processing", "fulfilled"]); // revenue-bearing statuses

export default async function SalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("user_id", user!.id);
  const storeName = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const storeIds = (stores ?? []).map((s) => s.id);

  const { data: orders } = storeIds.length
    ? await supabase
        .from("store_orders")
        .select("store_id, subtotal, items, status, created_at")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const paid = (orders ?? []).filter((o) => COUNTED.has(o.status));

  const revenue = paid.reduce((s, o) => s + (o.subtotal ?? 0), 0);
  const orderCount = paid.length;
  const units = paid.reduce((s, o) => s + (o.items ?? []).reduce((n, i) => n + i.quantity, 0), 0);
  const avg = orderCount ? revenue / orderCount : 0;

  // Revenue by store.
  const byStore = new Map<string, number>();
  paid.forEach((o) => byStore.set(o.store_id, (byStore.get(o.store_id) ?? 0) + (o.subtotal ?? 0)));
  const storeRows = [...byStore.entries()]
    .map(([id, total]) => ({ name: storeName.get(id) ?? "—", total }))
    .sort((a, b) => b.total - a.total);

  // Top products by units sold.
  const byProduct = new Map<string, { units: number; revenue: number }>();
  paid.forEach((o) =>
    (o.items ?? []).forEach((i) => {
      const cur = byProduct.get(i.name) ?? { units: 0, revenue: 0 };
      cur.units += i.quantity;
      cur.revenue += (i.unit_price ?? 0) * i.quantity;
      byProduct.set(i.name, cur);
    }),
  );
  const topProducts = [...byProduct.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  // Last 14 days revenue buckets.
  const days: { label: string; total: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: 0,
    });
  }
  const dayIndex = new Map(days.map((d, i) => [d.label, i]));
  paid.forEach((o) => {
    const label = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const idx = dayIndex.get(label);
    if (idx !== undefined) days[idx].total += o.subtotal ?? 0;
  });
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const metrics = [
    { label: "Revenue", value: money(revenue), icon: DollarSign },
    { label: "Orders", value: String(orderCount), icon: ShoppingBag },
    { label: "Avg. order", value: money(avg), icon: Receipt },
    { label: "Units sold", value: String(units), icon: Package },
  ];

  const empty = orderCount === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Sales</h1>
        <p className="mt-1 text-sm text-ink-500">Revenue and performance across your stores.</p>
      </div>

      {empty ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
            <TrendingUp className="h-7 w-7" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-ink-500">
            No sales yet. Once customers start buying, your revenue and top products show up here.
          </p>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-ink-100 bg-white p-4">
                <div className="flex items-center gap-2 text-ink-400">
                  <m.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-ink-950">{m.value}</p>
              </div>
            ))}
          </div>

          {/* 14-day revenue chart */}
          <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
            <p className="text-sm font-semibold text-ink-900">Revenue · last 14 days</p>
            <div className="mt-5 flex h-40 items-end gap-1.5">
              {days.map((d) => (
                <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-brand-400 transition-all group-hover:bg-brand-500"
                      style={{ height: `${Math.max(2, (d.total / maxDay) * 100)}%` }}
                      title={`${d.label}: ${money(d.total)}`}
                    />
                  </div>
                  <span className="text-[9px] text-ink-400">{d.label.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Revenue by store */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="text-sm font-semibold text-ink-900">Revenue by store</p>
              <div className="mt-4 space-y-3">
                {storeRows.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{s.name}</span>
                      <span className="font-semibold text-ink-900">{money(s.total)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: `${(s.total / (storeRows[0]?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="text-sm font-semibold text-ink-900">Top products</p>
              <div className="mt-4 space-y-3">
                {topProducts.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="max-w-[60%] truncate text-ink-700" title={p.name}>
                      {p.name}
                    </span>
                    <span className="text-ink-400">
                      {p.units} sold · <span className="font-semibold text-ink-900">{money(p.revenue)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
