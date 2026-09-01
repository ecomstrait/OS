"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import type { ProductStatus } from "@ecomstrait/db/types";
import { requireApprovedSupplier } from "@/lib/supplier-context";
import { enrichProduct, type EnrichInput, type Enrichment } from "@/lib/ai";
import { chunk, cleanIds, type BulkResult } from "@/lib/bulk";
import { syncProductToStores } from "@/lib/sync-stores";
import { assertCanAddProduct, assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";

/** Raw form values (strings from inputs); parsed here into typed columns. */
export type ProductInput = {
  title: string;
  description?: string;
  category?: string;
  sku?: string;
  wholesale_price?: string;
  retail_price?: string;
  stock?: string;
  status?: ProductStatus;
  seo_title?: string;
  seo_description?: string;
  images?: string[];
};

function num(v?: string): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toRow(input: ProductInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    sku: input.sku?.trim() || null,
    wholesale_price: num(input.wholesale_price),
    retail_price: num(input.retail_price),
    stock: Math.max(0, Math.trunc(num(input.stock) ?? 0)),
    status: input.status ?? "draft",
    seo_title: input.seo_title?.trim() || null,
    seo_description: input.seo_description?.trim() || null,
    images: input.images ?? [],
  };
}

export async function createProduct(input: ProductInput): Promise<{ error: string } | never> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;
  const limit = await assertCanAddProduct();
  if (!limit.ok) return limit;
  const { error } = await ctx.supabase
    .from("products")
    .insert({ supplier_id: ctx.supplierId, ...toRow(input) });
  if (error) return { error: error.message };
  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<{ error: string } | never> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;

  // Captured before the write: the price cascade needs to know which listings
  // were still following this product's old price.
  const { data: before } = await ctx.supabase
    .from("products")
    .select("retail_price")
    .eq("id", id)
    .eq("supplier_id", ctx.supplierId)
    .maybeSingle();

  const { error } = await ctx.supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };

  // Custom-website storefronts read this row live, so title and images are
  // already correct there — but their price comes from `store_products`, and
  // Shopify stores hold a full copy that would otherwise stay frozen at
  // whatever it was when the merchant listed it.
  after(() => syncProductToStores(id, { previousPrice: before?.retail_price ?? null }));

  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };
  revalidatePath("/catalog");
  return {};
}

export async function setProductStatus(
  id: string,
  status: ProductStatus,
): Promise<{ error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("products")
    .update({ status })
    .eq("id", id)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };

  // Unpublishing has to reach the storefronts already selling it, or the
  // product stays buyable on every store that listed it while we consider it
  // withdrawn. Publishing again brings the same listings back.
  after(() => syncProductToStores(id, { status: true, content: false, stock: false }));

  revalidatePath("/catalog");
  return {};
}

/**
 * Publish or unpublish many products at once. Every query is scoped to the
 * caller's supplier, so ids belonging to another supplier are silently skipped
 * rather than trusted — `affected` reflects what actually changed.
 */
export async function bulkSetProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<BulkResult> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { affected: 0, error: ctx.error };

  const targets = cleanIds(ids);
  if (!targets.length) return { affected: 0, error: "Nothing selected." };

  let affected = 0;
  const changed: string[] = [];
  for (const part of chunk(targets)) {
    const { data, error } = await ctx.supabase
      .from("products")
      .update({ status })
      .eq("supplier_id", ctx.supplierId)
      .in("id", part)
      .select("id");
    if (error) return { affected, error: error.message };
    changed.push(...(data ?? []).map((r) => r.id));
    affected += data?.length ?? 0;
  }

  // Same reason as setProductStatus: unpublishing has to reach the storefronts
  // already selling these, or they stay buyable after we've withdrawn them.
  after(() => syncProductToStores(changed, { status: true, content: false, stock: false }));

  revalidatePath("/catalog");
  revalidatePath("/inventory");
  return { affected };
}

/** Delete many products at once. Scoped to the caller's supplier. */
export async function bulkDeleteProducts(ids: string[]): Promise<BulkResult> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { affected: 0, error: ctx.error };

  const targets = cleanIds(ids);
  if (!targets.length) return { affected: 0, error: "Nothing selected." };

  let affected = 0;
  for (const part of chunk(targets)) {
    const { data, error } = await ctx.supabase
      .from("products")
      .delete()
      .eq("supplier_id", ctx.supplierId)
      .in("id", part)
      .select("id");
    if (error) return { affected, error: error.message };
    affected += data?.length ?? 0;
  }

  revalidatePath("/catalog");
  revalidatePath("/inventory");
  return { affected };
}

export async function bulkImportProducts(
  rows: ProductInput[],
): Promise<{ imported: number; error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { imported: 0, error: ctx.error };
  const clean = rows.filter((r) => r.title?.trim());
  if (!clean.length) return { imported: 0, error: "No valid rows found." };
  const limit = await assertCanAddProduct(clean.length);
  if (!limit.ok) return { imported: 0, error: limit.error };
  const { error, count } = await ctx.supabase
    .from("products")
    .insert(clean.map((r) => ({ supplier_id: ctx.supplierId, ...toRow(r) })), { count: "exact" });
  if (error) return { imported: 0, error: error.message };
  revalidatePath("/catalog");
  return { imported: count ?? clean.length };
}

export async function enrichProductAction(input: EnrichInput): Promise<Enrichment | { error: string }> {
  const budget = await assertTokenBudget(500);
  if (!budget.ok) return { error: budget.error };
  const result = await enrichProduct(input);
  await recordTokenUsage(result.tokensUsed);
  return result;
}
