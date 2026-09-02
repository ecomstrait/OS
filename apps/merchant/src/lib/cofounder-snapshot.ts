import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ecomstrait/db/types";
import { createAdminClient } from "@ecomstrait/db";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

export type MerchantSnapshot = {
  storeCount: number;
  liveStoreCount: number;
  storeNames: string[];
  revenue: { total: number; orderCount: number; avgOrder: number; units: number };
  revenueByStore: { name: string; total: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  walletBalance: number;
  heldOrders: { count: number; value: number };
};

const COUNTED_STATUS = new Set(["paid", "processing", "fulfilled"]); // revenue-bearing, mirrors /sales

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Revenue/store/wallet snapshot for a merchant — same role as
 * apps/supplier's revenue-analytics.ts, reusing the exact queries already
 * proven on the Sales and Wallet pages instead of re-deriving them.
 *
 * `admin` is optional and only used for the held-orders (low-credits) count:
 * `orders` (the internal per-supplier table `credit_status` lives on) has no
 * merchant-facing RLS policy, same reason the Wallet page reads it via the
 * admin client rather than the session-scoped one.
 */
export async function getMerchantSnapshot(
  supabase: SupabaseClient<Database>,
  admin: Admin | null,
  userId: string,
): Promise<MerchantSnapshot> {
  const { data: stores } = await supabase.from("stores").select("id, name, launched_at").eq("user_id", userId);
  const storeList = stores ?? [];
  const storeName = new Map(storeList.map((s) => [s.id, s.name]));
  const storeIds = storeList.map((s) => s.id);
  const liveStoreCount = storeList.filter((s) => s.launched_at).length;

  const { data: orders } = storeIds.length
    ? await supabase
        .from("store_orders")
        .select("store_id, subtotal, items, status")
        .in("store_id", storeIds)
    : { data: [] };
  const paid = (orders ?? []).filter((o) => COUNTED_STATUS.has(o.status));

  const total = paid.reduce((s, o) => s + (o.subtotal ?? 0), 0);
  const orderCount = paid.length;
  const units = paid.reduce((s, o) => s + (o.items ?? []).reduce((n, i) => n + i.quantity, 0), 0);

  const byStore = new Map<string, number>();
  for (const o of paid) byStore.set(o.store_id, (byStore.get(o.store_id) ?? 0) + (o.subtotal ?? 0));
  const revenueByStore = [...byStore.entries()]
    .map(([id, t]) => ({ name: storeName.get(id) ?? "Store", total: round2(t) }))
    .sort((a, b) => b.total - a.total);

  const byProduct = new Map<string, { units: number; revenue: number }>();
  for (const o of paid) {
    for (const i of o.items ?? []) {
      const cur = byProduct.get(i.name) ?? { units: 0, revenue: 0 };
      cur.units += i.quantity;
      cur.revenue += (i.unit_price ?? 0) * i.quantity;
      byProduct.set(i.name, cur);
    }
  }
  const topProducts = [...byProduct.entries()]
    .map(([name, v]) => ({ name, units: v.units, revenue: round2(v.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  let walletBalance = 0;
  let heldCount = 0;
  let heldValue = 0;
  if (admin) {
    const { data: wallet } = await admin.from("merchant_wallets").select("balance").eq("user_id", userId).maybeSingle();
    walletBalance = wallet?.balance ?? 0;

    if (storeIds.length) {
      const { data: held } = await admin
        .from("orders")
        .select("cost_amount, platform_fee_amount")
        .in("store_id", storeIds)
        .eq("credit_status", "awaiting_merchant_credits");
      heldCount = held?.length ?? 0;
      heldValue = round2((held ?? []).reduce((s, o) => s + (o.cost_amount ?? 0) + (o.platform_fee_amount ?? 0), 0));
    }
  }

  return {
    storeCount: storeList.length,
    liveStoreCount,
    storeNames: storeList.map((s) => s.name).filter((n): n is string => Boolean(n)),
    revenue: { total: round2(total), orderCount, avgOrder: round2(orderCount ? total / orderCount : 0), units },
    revenueByStore,
    topProducts,
    walletBalance,
    heldOrders: { count: heldCount, value: heldValue },
  };
}

/** Compact plain-text digest for the EcomAI Co-Founder chat's system prompt. */
export function summarizeMerchantForAdvisor(s: MerchantSnapshot): string {
  const lines = [
    `Stores: ${s.storeCount} total (${s.liveStoreCount} live)${
      s.storeNames.length ? `: ${s.storeNames.join(", ")}` : ""
    }.`,
    `Revenue (all-time, paid/processing/fulfilled orders): $${s.revenue.total.toFixed(2)} across ${
      s.revenue.orderCount
    } orders, avg order $${s.revenue.avgOrder.toFixed(2)}, ${s.revenue.units} units sold.`,
    s.revenueByStore.length
      ? `Revenue by store: ${s.revenueByStore.map((r) => `${r.name} $${r.total.toFixed(2)}`).join(", ")}.`
      : `No store-level revenue yet.`,
    s.topProducts.length
      ? `Top products by revenue: ${s.topProducts
          .slice(0, 3)
          .map((p) => `${p.name} ($${p.revenue.toFixed(2)}, ${p.units} units)`)
          .join("; ")}.`
      : `No product sales data yet.`,
    `Wallet balance: $${s.walletBalance.toFixed(2)}.`,
    s.heldOrders.count > 0
      ? `${s.heldOrders.count} order(s) worth $${s.heldOrders.value.toFixed(2)} are on hold, not yet sent to suppliers because the wallet balance doesn't cover them.`
      : `No orders currently blocked by low wallet credits.`,
  ];
  return lines.join("\n");
}
