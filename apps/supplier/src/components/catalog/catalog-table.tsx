"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { cn } from "@ecomstrait/ui";
import type { Product } from "@ecomstrait/db/types";
import { setProductStatus, deleteProduct } from "@/lib/product-actions";

type Row = Pick<
  Product,
  "id" | "title" | "category" | "status" | "retail_price" | "stock" | "images"
>;

export function CatalogTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const supabase = createClient();

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
      await deleteProduct(p.id);
      router.refresh();
    });
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ink-100 bg-white", pending && "opacity-70")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
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
            return (
              <tr key={p.id} className="border-b border-ink-50 last:border-0">
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
                      href={`/catalog/${p.id}/edit`}
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
  );
}
