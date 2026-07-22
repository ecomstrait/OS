import Link from "next/link";
import type { Metadata } from "next";
import { Boxes, Plus, Upload } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { CatalogTable } from "@/components/catalog/catalog-table";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage() {
  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  const { data: products } =
    supplier && approved
      ? await supabase
          .from("products")
          .select("id, title, category, status, retail_price, stock, images")
          .eq("supplier_id", supplier.supplierId)
          .order("created_at", { ascending: false })
      : { data: [] };

  const list = products ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Catalog</h1>
          <p className="mt-1 text-sm text-ink-500">Publish and manage the products you supply.</p>
        </div>
        {approved && (
          <div className="flex items-center gap-2">
            <Link
              href="/catalog/import"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              <Upload className="h-4 w-4" /> Import CSV
            </Link>
            <Link
              href="/catalog/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        {!approved ? (
          <PendingGate status={supplier?.status ?? null} feature="your catalog" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No products yet"
            body="Add your first product manually, or import your catalog from a CSV."
            cta={{ href: "/catalog/new", label: "Add product" }}
          />
        ) : (
          <CatalogTable products={list} />
        )}
      </div>
    </div>
  );
}
