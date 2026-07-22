import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RequestStatus, Supplier } from "@ecomstrait/db/types";
import { computeQualityScore, PROFILE_FIELDS, type QualityResult } from "@/lib/quality";

export type SupplierAnalytics = {
  quality: QualityResult;
  requestsByDay: { date: string; count: number }[];
  statusCounts: { status: RequestStatus; count: number }[];
  categoryCounts: { category: string; count: number }[];
  inventory: { inStock: number; low: number; out: number };
  metrics: {
    totalRequests: number;
    openRequests: number;
    acceptanceRate: number | null;
    responseRate: number | null;
    avgResponseHours: number | null;
    publishedProducts: number;
  };
};

const RESPONDED: RequestStatus[] = ["accepted", "declined", "proposed", "fulfilled"];
const ACCEPTED: RequestStatus[] = ["accepted", "fulfilled"];

export async function getSupplierAnalytics(
  supabase: SupabaseClient<Database>,
  supplier: Supplier,
): Promise<SupplierAnalytics> {
  const [{ data: products }, { data: verification }, { data: requests }] = await Promise.all([
    supabase
      .from("products")
      .select("status, stock, reserved, low_stock_threshold, category")
      .eq("supplier_id", supplier.id),
    supabase
      .from("supplier_verification")
      .select("*")
      .eq("supplier_id", supplier.id)
      .maybeSingle(),
    supabase
      .from("product_requests")
      .select("status, created_at, updated_at")
      .eq("supplier_id", supplier.id),
  ]);

  const prods = products ?? [];
  const reqs = requests ?? [];

  // ---- Inventory ----
  let inStock = 0,
    low = 0,
    out = 0;
  for (const p of prods) {
    const available = p.stock - p.reserved;
    if (available <= 0) out += 1;
    else if (available <= p.low_stock_threshold) low += 1;
    else inStock += 1;
  }

  // ---- Categories (published products) ----
  const catMap = new Map<string, number>();
  for (const p of prods) {
    if (p.status !== "published") continue;
    const c = p.category?.trim() || "Uncategorised";
    catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }
  const categoryCounts = [...catMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ---- Requests: status + trend + rates ----
  const statusOrder: RequestStatus[] = ["new", "proposed", "accepted", "fulfilled", "declined"];
  const statusCounts = statusOrder.map((status) => ({
    status,
    count: reqs.filter((r) => r.status === status).length,
  }));

  const days = 14;
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date(now);
    dt.setDate(now.getDate() - d);
    buckets.set(dt.toISOString().slice(0, 10), 0);
  }
  for (const r of reqs) {
    const key = r.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const requestsByDay = [...buckets.entries()].map(([date, count]) => ({ date, count }));

  const responded = reqs.filter((r) => RESPONDED.includes(r.status));
  const accepted = reqs.filter((r) => ACCEPTED.includes(r.status));
  const openRequests = reqs.filter((r) => r.status === "new" || r.status === "proposed").length;

  const avgResponseHours = responded.length
    ? Math.round(
        (responded.reduce(
          (s, r) => s + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()),
          0,
        ) /
          responded.length /
          3_600_000) *
          10,
      ) / 10
    : null;

  // ---- Quality ----
  const profileFilled = PROFILE_FIELDS.filter((f) => {
    const v = supplier[f];
    return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
  }).length;
  const catNonEmpty = (supplier.product_categories ?? []).length > 0 ? 1 : 0;

  const verLevels = verification
    ? [
        verification.email_verified_at,
        verification.phone_verified_at,
        verification.documents_verified_at,
        verification.manual_reviewed_at,
        verification.badge_granted_at,
      ].filter(Boolean).length
    : 0;

  const publishedProducts = prods.filter((p) => p.status === "published").length;

  const quality = computeQualityScore({
    profileFilled: profileFilled + catNonEmpty,
    profileTotal: PROFILE_FIELDS.length + 1,
    verificationDone: verLevels,
    verificationTotal: 5,
    publishedProducts,
    productsTotal: prods.length,
    inStockProducts: inStock,
    totalRequests: reqs.length,
    respondedRequests: responded.length,
    acceptedRequests: accepted.length,
  });

  return {
    quality,
    requestsByDay,
    statusCounts,
    categoryCounts,
    inventory: { inStock, low, out },
    metrics: {
      totalRequests: reqs.length,
      openRequests,
      acceptanceRate: responded.length ? Math.round((accepted.length / responded.length) * 100) : null,
      responseRate: reqs.length ? Math.round((responded.length / reqs.length) * 100) : null,
      avgResponseHours,
      publishedProducts,
    },
  };
}
