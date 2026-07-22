import type { Metadata } from "next";
import { Boxes, PackageCheck, AlertTriangle, PackageX, History } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { InventoryTable, type InventoryRow } from "@/components/inventory/inventory-table";

export const metadata: Metadata = { title: "Inventory" };

type Adjustment = {
  id: string;
  delta: number;
  reason: string | null;
  resulting_stock: number;
  created_at: string;
  products: { title: string } | null;
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  const { data: products } =
    supplier && approved
      ? await supabase
          .from("products")
          .select("id, title, stock, reserved, low_stock_threshold")
          .eq("supplier_id", supplier.supplierId)
          .order("title")
      : { data: [] };

  const rows: InventoryRow[] = products ?? [];

  const { data: history } =
    supplier && approved
      ? await supabase
        .from("inventory_adjustments")
        .select("id, delta, reason, resulting_stock, created_at, products(title)")
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [] };

  const adjustments = (history ?? []) as unknown as Adjustment[];

  const stats = rows.reduce(
    (acc, r) => {
      const available = r.stock - r.reserved;
      if (available <= 0) acc.out += 1;
      else if (available <= r.low_stock_threshold) acc.low += 1;
      else acc.ok += 1;
      return acc;
    },
    { ok: 0, low: 0, out: 0 },
  );

  const tiles = [
    { label: "Products", value: rows.length, icon: Boxes, tone: "text-ink-400" },
    { label: "In stock", value: stats.ok, icon: PackageCheck, tone: "text-brand-500" },
    { label: "Low stock", value: stats.low, icon: AlertTriangle, tone: "text-amber-500" },
    { label: "Out of stock", value: stats.out, icon: PackageX, tone: "text-red-500" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">Inventory</h1>
      <p className="mt-1 text-sm text-ink-500">Track stock levels and get ahead of low stock.</p>

      {!approved ? (
        <div className="mt-6">
          <PendingGate status={supplier?.status ?? null} feature="inventory" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Boxes}
            title="Nothing to track yet"
            body="Add products to your catalog and their stock levels will show up here."
            cta={{ href: "/catalog/new", label: "Add product" }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-2xl border border-ink-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-400">{t.label}</span>
                  <t.icon className={`h-4 w-4 ${t.tone}`} />
                </div>
                <p className="mt-2 text-2xl font-bold text-ink-950">{t.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <InventoryTable rows={rows} />
          </div>

          {/* Recent adjustment history */}
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
              <History className="h-4 w-4 text-ink-400" /> Recent activity
            </h2>
            {adjustments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-400">No stock changes yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink-50 rounded-2xl border border-ink-100 bg-white">
                {adjustments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 truncate text-ink-700">
                      {a.products?.title ?? "Product"}
                      <span className="text-ink-400"> · {a.reason ?? "Adjustment"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={a.delta >= 0 ? "font-semibold text-brand-600" : "font-semibold text-red-500"}>
                        {a.delta >= 0 ? `+${a.delta}` : a.delta}
                      </span>
                      <span className="text-ink-400">→ {a.resulting_stock}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
