"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { cn } from "@ecomstrait/ui";
import type { Product } from "@ecomstrait/db/types";
import {
  setProductStatus,
  deleteProduct,
  bulkSetProductStatus,
  bulkDeleteProducts,
} from "@/lib/product-actions";
import { bulkSetStock, bulkAdjustStock } from "@/lib/inventory-actions";
import type { BulkResult } from "@/lib/bulk";
import { BulkBar } from "@/components/catalog/bulk-bar";
import { useToast } from "@/components/app/toast";

type Row = Pick<
  Product,
  "id" | "title" | "category" | "status" | "retail_price" | "stock" | "images"
>;

/**
 * `returnTo` is the current list URL (search + page), threaded in from the
 * catalog page's own searchParams — the Edit link forwards it so Cancel/Save
 * on the edit page can return here instead of a bare, filter-losing
 * `/catalog`.
 */
export function CatalogTable({ products, returnTo }: { products: Row[]; returnTo: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const supabase = createClient();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BulkResult | null>(null);
  const headBox = useRef<HTMLInputElement>(null);

  // Derive the live selection rather than pruning state in an effect: ids that
  // no longer exist (deleted, then refreshed) simply stop matching a row.
  const ids = useMemo(
    () => products.filter((p) => selected.has(p.id)).map((p) => p.id),
    [products, selected],
  );

  const allSelected = products.length > 0 && ids.length === products.length;
  const someSelected = ids.length > 0 && !allSelected;

  useEffect(() => {
    if (headBox.current) headBox.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleRow(id: string) {
    setResult(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setResult(null);
    setSelected((prev) => (products.every((p) => prev.has(p.id)) ? new Set() : new Set(products.map((p) => p.id))));
  }

  /**
   * Run a bulk action, surface its result, and refresh the list.
   * `onDone` is an extra, optional callback for the caller's own feedback
   * (e.g. a toast) — kept separate from the inline `result` status text so
   * existing bulk actions (publish/unpublish/stock) keep their current
   * behavior unchanged; only callers that pass it get more.
   */
  function runBulk(
    action: () => Promise<BulkResult>,
    clearOnSuccess = false,
    onDone?: (res: BulkResult) => void,
  ) {
    setResult(null);
    start(async () => {
      const res = await action();
      setResult(res);
      if (!res.error && clearOnSuccess) setSelected(new Set());
      onDone?.(res);
      router.refresh();
    });
  }

  function thumb(images: string[]) {
    if (!images.length) return null;
    return supabase.storage.from("product-images").getPublicUrl(images[0]).data.publicUrl;
  }

  function toggle(p: Row) {
    start(async () => {
      await setProductStatus(p.id, p.status === "published" ? "draft" : "published");
      router.refresh();
    });
  }

  function remove(p: Row) {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteProduct(p.id);
      if (res.error) showToast(res.error, "error");
      else showToast(`"${p.title}" deleted.`);
      router.refresh();
    });
  }

  function bulkRemove() {
    if (
      !confirm(
        `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This can't be undone.`,
      )
    )
      return;
    runBulk(
      () => bulkDeleteProducts(ids),
      true,
      (res) => {
        if (res.error) showToast(res.error, "error");
        else showToast(`${res.affected} product${res.affected === 1 ? "" : "s"} deleted.`);
      },
    );
  }

  return (
    <>
      <div className={cn("overflow-hidden rounded-2xl border border-ink-100 bg-white", pending && "opacity-70")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
              <th className="w-10 pl-4 pr-0 py-3">
                <input
                  ref={headBox}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={
                    allSelected
                      ? "Deselect all products on this page"
                      : "Select all products on this page"
                  }
                  className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
                />
              </th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const src = thumb(p.images);
              const checked = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-ink-50 last:border-0",
                    checked && "bg-brand-50/40",
                  )}
                >
                  <td className="w-10 pl-4 pr-0 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRow(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-100 text-xs text-ink-400">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className="font-medium text-ink-900">{p.title}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{p.category ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {p.retail_price != null ? `$${p.retail_price}` : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-700 sm:table-cell">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        p.status === "published"
                          ? "bg-brand-50 text-brand-700"
                          : "bg-ink-100 text-ink-500",
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggle(p)}
                        disabled={pending}
                        aria-label={p.status === "published" ? "Unpublish" : "Publish"}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
                      >
                        {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/catalog/${p.id}/edit?from=${encodeURIComponent(returnTo)}`}
                        aria-label="Edit"
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => remove(p)}
                        disabled={pending}
                        aria-label="Delete"
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ids.length > 0 && (
        <BulkBar
          count={ids.length}
          pending={pending}
          result={result}
          onPublish={() => runBulk(() => bulkSetProductStatus(ids, "published"), true)}
          onUnpublish={() => runBulk(() => bulkSetProductStatus(ids, "draft"), true)}
          onSetStock={(stock) => runBulk(() => bulkSetStock(ids, stock))}
          onAdjustStock={(delta) => runBulk(() => bulkAdjustStock(ids, delta))}
          onDelete={bulkRemove}
          onClear={() => {
            setSelected(new Set());
            setResult(null);
          }}
        />
      )}
    </>
  );
}
