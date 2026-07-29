"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedSupplier } from "@/lib/supplier-context";
import { chunk, cleanIds, type BulkResult } from "@/lib/bulk";

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

/** The success branch of requireApprovedSupplier (client + resolved supplier). */
type SupplierCtx = Extract<Awaited<ReturnType<typeof requireApprovedSupplier>>, { supplierId: string }>;

/**
 * Read the caller's own stock levels for a set of product ids. Rows belonging
 * to another supplier simply don't come back, which is what scopes every bulk
 * stock action below.
 */
async function readStock(
  ctx: SupplierCtx,
  ids: string[],
): Promise<{ rows: { id: string; stock: number }[]; error?: string }> {
  const rows: { id: string; stock: number }[] = [];
  for (const part of chunk(ids)) {
    const { data, error } = await ctx.supabase
      .from("products")
      .select("id, stock")
      .eq("supplier_id", ctx.supplierId)
      .in("id", part);
    if (error) return { rows, error: error.message };
    rows.push(...(data ?? []));
  }
  return { rows };
}

/**
 * Set many products to the same absolute stock level, logging one adjustment
 * per product that actually moved. Products already at the target value are
 * skipped so the history doesn't fill with no-op entries.
 */
export async function bulkSetStock(ids: string[], stock: number): Promise<BulkResult> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { affected: 0, error: ctx.error };

  const targets = cleanIds(ids);
  if (!targets.length) return { affected: 0, error: "Nothing selected." };
  if (!Number.isFinite(stock)) return { affected: 0, error: "Enter a stock number." };
  const next = Math.max(0, Math.trunc(stock));

  const { rows, error: readErr } = await readStock(ctx, targets);
  if (readErr) return { affected: 0, error: readErr };

  const changed = rows.filter((r) => r.stock !== next);
  if (!changed.length) return { affected: 0 };

  for (const part of chunk(changed.map((c) => c.id))) {
    const { error } = await ctx.supabase
      .from("products")
      .update({ stock: next })
      .eq("supplier_id", ctx.supplierId)
      .in("id", part);
    if (error) return { affected: 0, error: error.message };
  }

  await ctx.supabase.from("inventory_adjustments").insert(
    changed.map((c) => ({
      product_id: c.id,
      delta: next - c.stock,
      resulting_stock: next,
      reason: "Bulk update",
    })),
  );

  revalidatePath("/inventory");
  revalidatePath("/catalog");
  return { affected: changed.length };
}

/**
 * Add to (or subtract from) many products' stock. Products landing on the same
 * resulting value are updated together, so this costs a handful of queries
 * rather than one per product. Stock floors at zero.
 */
export async function bulkAdjustStock(ids: string[], delta: number): Promise<BulkResult> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { affected: 0, error: ctx.error };

  const targets = cleanIds(ids);
  if (!targets.length) return { affected: 0, error: "Nothing selected." };
  if (!Number.isFinite(delta)) return { affected: 0, error: "Enter an amount." };
  const step = Math.trunc(delta);
  if (step === 0) return { affected: 0, error: "Enter a non-zero amount." };

  const { rows, error: readErr } = await readStock(ctx, targets);
  if (readErr) return { affected: 0, error: readErr };

  // Group by resulting stock so each distinct value is a single update.
  const byNext = new Map<number, { id: string; stock: number }[]>();
  for (const r of rows) {
    const next = Math.max(0, r.stock + step);
    if (next === r.stock) continue; // already floored at zero
    const bucket = byNext.get(next);
    if (bucket) bucket.push(r);
    else byNext.set(next, [r]);
  }
  if (!byNext.size) return { affected: 0 };

  const log: { product_id: string; delta: number; resulting_stock: number; reason: string }[] = [];
  for (const [next, group] of byNext) {
    for (const part of chunk(group.map((g) => g.id))) {
      const { error } = await ctx.supabase
        .from("products")
        .update({ stock: next })
        .eq("supplier_id", ctx.supplierId)
        .in("id", part);
      if (error) return { affected: 0, error: error.message };
    }
    for (const g of group) {
      log.push({
        product_id: g.id,
        delta: next - g.stock,
        resulting_stock: next,
        reason: step > 0 ? `Bulk +${step}` : `Bulk ${step}`,
      });
    }
  }

  await ctx.supabase.from("inventory_adjustments").insert(log);

  revalidatePath("/inventory");
  revalidatePath("/catalog");
  return { affected: log.length };
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
