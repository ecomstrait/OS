"use server";

import { requireApprovedSupplier } from "@/lib/supplier-context";
import { getSupplierRevenueAnalytics, summarizeForAdvisor } from "@/lib/revenue-analytics";
import { getSupplierAnalytics, summarizeCatalogForAdvisor } from "@/lib/analytics-data";
import { askCoFounder, type CoFounderTurn } from "@/lib/cofounder-ai";
import { assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";

export async function askCoFounderAction(
  history: CoFounderTurn[],
  message: string,
): Promise<{ reply: string } | { error: string }> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;
  if (!message.trim()) return { error: "Say something first." };

  const budget = await assertTokenBudget(700);
  if (!budget.ok) return { error: budget.error };

  // Full row (not just business_name): getSupplierAnalytics needs it for the
  // quality-score/profile-completeness factors.
  const { data: supplier } = await ctx.supabase
    .from("suppliers")
    .select("*")
    .eq("id", ctx.supplierId)
    .maybeSingle();

  // Two independent snapshots (revenue/orders/wallet, catalog/stock/quality)
  // combined into one digest — previously only revenue was wired in, so the
  // advisor had no way to answer anything about products, stock, or the
  // quality score.
  const [revenue, catalog] = await Promise.all([
    getSupplierRevenueAnalytics(ctx.supabase, ctx.supplierId),
    supplier ? getSupplierAnalytics(ctx.supabase, supplier) : null,
  ]);
  const snapshot = [summarizeForAdvisor(revenue), catalog ? summarizeCatalogForAdvisor(catalog) : null]
    .filter(Boolean)
    .join("\n");

  const result = await askCoFounder(supplier?.business_name || "your business", snapshot, history, message.trim());
  await recordTokenUsage(result.tokensUsed);
  return { reply: result.reply };
}
