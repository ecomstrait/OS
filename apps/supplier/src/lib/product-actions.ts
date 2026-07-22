"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductStatus } from "@ecomstrait/db/types";
import { requireApprovedSupplier } from "@/lib/supplier-context";
import { enrichProduct, type EnrichInput, type Enrichment } from "@/lib/ai";

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
  const { error } = await ctx.supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id)
    .eq("supplier_id", ctx.supplierId);
  if (error) return { error: error.message };
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
  revalidatePath("/catalog");
  return {};
}

export async function bulkImportProducts(
  rows: ProductInput[],
): Promise<{ imported: number; error?: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return { imported: 0, error: ctx.error };
  const clean = rows.filter((r) => r.title?.trim());
  if (!clean.length) return { imported: 0, error: "No valid rows found." };
  const { error, count } = await ctx.supabase
    .from("products")
    .insert(clean.map((r) => ({ supplier_id: ctx.supplierId, ...toRow(r) })), { count: "exact" });
  if (error) return { imported: 0, error: error.message };
  revalidatePath("/catalog");
  return { imported: count ?? clean.length };
}

export async function enrichProductAction(input: EnrichInput): Promise<Enrichment> {
  return enrichProduct(input);
}
