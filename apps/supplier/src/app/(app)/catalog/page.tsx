import Link from "next/link";
import type { Metadata } from "next";
import { Boxes, Plus, Upload, SearchX } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { EmptyState } from "@/components/app/empty-state";
import { PendingGate } from "@/components/app/pending-gate";
import { SearchBar } from "@/components/app/search-bar";
import { Pagination } from "@/components/app/pagination";
import { CatalogTable } from "@/components/catalog/catalog-table";
import { clampPage, likeTerm, parseTableParams, type RawParams } from "@/lib/table-params";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const { q, page: wanted, size } = parseTableParams(params);

  const supabase = await createClient();
  const supplier = await getMySupplier();
  const approved = supplier?.status === "approved";

  let list: NonNullable<Awaited<ReturnType<typeof loadPage>>>["rows"] = [];
  let total = 0;
  let page = wanted;

  async function loadPage(supplierId: string, from: number, to: number) {
    let query = supabase
      .from("products")
      .select("id, title, category, status, retail_price, stock, images", { count: "exact" })
      .eq("supplier_id", supplierId);
    if (q) {
      query = query.or(
        `title.ilike.${likeTerm(q)},category.ilike.${likeTerm(q)},sku.ilike.${likeTerm(q)}`,
      );
    }
    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    return { rows: data ?? [], count: count ?? 0 };
  }

  if (supplier && approved) {
    // One cheap count-only pass so an out-of-range ?page= lands on the last page
    // instead of showing an empty table.
    const probe = await loadPage(supplier.supplierId, 0, 0);
    total = probe.count;
    page = clampPage(wanted, total, size);
    const from = (page - 1) * size;
    const result = await loadPage(supplier.supplierId, from, from + size - 1);
    list = result.rows;
  }

  const searching = q.length > 0;
  const shown = list.length;
  const summary = total > 0 ? `${(page - 1) * size + 1}–${(page - 1) * size + shown} of ${total}` : undefined;

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
        ) : total === 0 && !searching ? (
          <EmptyState
            icon={Boxes}
            title="No products yet"
            body="Add your first product manually, or import your catalog from a CSV."
            cta={{ href: "/catalog/new", label: "Add product" }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SearchBar placeholder="Search products, category, SKU…" summary={summary} />
            {list.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                body={`Nothing in your catalog matches “${q}”.`}
              />
            ) : (
              <>
                <CatalogTable products={list} />
                <Pagination basePath="/catalog" params={params} page={page} total={total} size={size} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
