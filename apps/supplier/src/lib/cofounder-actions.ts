"use server";

import { requireApprovedSupplier } from "@/lib/supplier-context";
import { getSupplierRevenueAnalytics } from "@/lib/revenue-analytics";
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

  const { data: supplier } = await ctx.supabase
    .from("suppliers")
    .select("business_name")
    .eq("id", ctx.supplierId)
    .maybeSingle();

  const snapshot = await getSupplierRevenueAnalytics(ctx.supabase, ctx.supplierId);
  const result = await askCoFounder(
    supplier?.business_name || "your business",
    snapshot,
    history,
    message.trim(),
  );
  await recordTokenUsage(result.tokensUsed);
  return { reply: result.reply };
}
