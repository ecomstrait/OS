"use server";

import { loadChatThread, appendChatTurns } from "@ecomstrait/ai";
import { requireApprovedSupplier } from "@/lib/supplier-context";
import { getSupplierRevenueAnalytics, summarizeForAdvisor } from "@/lib/revenue-analytics";
import { getSupplierAnalytics, summarizeCatalogForAdvisor } from "@/lib/analytics-data";
import { askCoFounder, type CoFounderTurn } from "@/lib/cofounder-ai";
import { assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";

export async function askCoFounderAction(
  history: CoFounderTurn[],
  message: string,
): Promise<
  | { reply: string; reasoningContent?: string; providerSpecificFields?: Record<string, unknown> }
  | { error: string; upgrade?: boolean }
> {
  const ctx = await requireApprovedSupplier();
  if ("error" in ctx) return ctx;
  if (!message.trim()) return { error: "Say something first." };

  // Estimate must track the role's real ceiling: askCoFounder calls the
  // "reasoning" role with maxTokens: 4000 (cofounder-ai.ts) — 700 was a stale
  // guess from before that role's mitigation was tuned up, and let a supplier
  // with well under a real call's worth of budget left start one anyway.
  // recordTokenUsage() below reconciles this against the actual spend
  // (gateway's real total_tokens) once the call completes.
  const budget = await assertTokenBudget(4000);
  if (!budget.ok) return { error: budget.error, upgrade: true };

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
  const [revenue, catalog, thread] = await Promise.all([
    getSupplierRevenueAnalytics(ctx.supabase, ctx.supplierId),
    supplier ? getSupplierAnalytics(ctx.supabase, supplier) : null,
    // One thread per supplier business (not per staff account) — see
    // packages/ai/src/memory/chat-threads.ts.
    loadChatThread({ tenantId: ctx.supplierId, agent: "supplier_cofounder", threadKey: ctx.supplierId }),
  ]);
  const snapshotLines = [summarizeForAdvisor(revenue), catalog ? summarizeCatalogForAdvisor(catalog) : null];
  // Hedged deliberately: this is an LLM-generated summary of earlier turns,
  // not a measured number like the lines above it — flag it as your own
  // (possibly imprecise) recollection so the model doesn't repeat it back
  // with the same confidence as the real snapshot data.
  if (thread.summary)
    snapshotLines.push(
      `Your own recollection of earlier in this conversation (may be imprecise, it's a summary, not a transcript): ${thread.summary}`,
    );
  const snapshot = snapshotLines.filter(Boolean).join("\n");

  const text = message.trim();
  const result = await askCoFounder(supplier?.business_name || "your business", snapshot, history, text);
  await recordTokenUsage(result.tokensUsed);
  await appendChatTurns({
    tenantId: ctx.supplierId,
    agent: "supplier_cofounder",
    threadKey: ctx.supplierId,
    turns: [
      { role: "user", content: text },
      {
        role: "assistant",
        content: result.reply,
        reasoningContent: result.reasoningContent,
        providerSpecificFields: result.providerSpecificFields,
      },
    ],
  });
  return {
    reply: result.reply,
    reasoningContent: result.reasoningContent,
    providerSpecificFields: result.providerSpecificFields,
  };
}
