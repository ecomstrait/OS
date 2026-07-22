"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedSupplier } from "@/lib/supplier-context";

/** Set a product's stock to an absolute value, logging the adjustment. */
export async function setStock(
  productId: string,
  newStock: number,
  reason?: string,
): Promise<{ error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;

  const stock = Math.max(0, Math.trunc(newStock));
  const { data: prod } = await ctx.supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .eq("supplier_id", ctx.supplierId)
    .maybeSingle();
  if (!prod) return { error: "Product not found." };
  if (prod.stock === stock) return {};

  const { error } = await ctx.supabase
    .from("products")
    .update({ stock })
    .eq("id", productId)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };

  await ctx.supabase.from("inventory_adjustments").insert({
    product_id: productId,
    delta: stock - prod.stock,
    resulting_stock: stock,
    reason: reason ?? "Manual update",
  });

  revalidatePath("/inventory");
  revalidatePath("/catalog");
  return {};
}

/** Update a product's low-stock threshold. */
export async function setThreshold(
  productId: string,
  threshold: number,
): Promise<{ error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;
  const { error } = await ctx.supabase
    .from("products")
    .update({ low_stock_threshold: Math.max(0, Math.trunc(threshold)) })
    .eq("id", productId)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return {};
}

/** Apply many stock changes at once (batch update). */
export async function batchSetStock(
  updates: { id: string; stock: number }[],
): Promise<{ updated: number; error?: string }> {
  let updated = 0;
  for (const u of updates) {
    const res = await setStock(u.id, u.stock, "Batch update");
    if (res.error) return { updated, error: res.error };
    updated += 1;
  }
  return { updated };
}
