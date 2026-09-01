import "server-only";
import { chat, isGatewayConfigured } from "@ecomstrait/ai";
import type { ChatMessage } from "@ecomstrait/ai";
import type { SupplierRevenueAnalytics } from "@/lib/revenue-analytics";
import { summarizeForAdvisor } from "@/lib/revenue-analytics";

export type CoFounderTurn = { role: "user" | "assistant"; content: string };

export type CoFounderReply = { reply: string; tokensUsed: number };

const SYSTEM_PROMPT = (businessName: string, snapshot: string) =>
  [
    `You are this supplier's AI co-founder — a sharp, pragmatic advisor for their wholesale/dropshipping business "${businessName}" on EcomStrait.`,
    "Give concrete, specific advice grounded ONLY in the business snapshot below — never invent numbers, orders, or products that aren't in it.",
    "If something isn't in the snapshot, say plainly that you don't have that data rather than guessing.",
    "Keep replies focused and actionable: 2-5 short paragraphs or a short list, not a wall of text. No hype, no emojis.",
    "",
    "Current business snapshot:",
    snapshot,
  ].join("\n");

/**
 * No tool-calling agent, no SQL access, no LangGraph orchestrator —
 * deliberately: the merchant app's equivalent (`askBusinessAdvisor`) uses a
 * `run_sql_query` tool that executes arbitrary LLM-generated SQL with no
 * tenant scoping (packages/ai/src/agents/tools/supabase-query-tool.ts), a
 * real cross-tenant data-leak risk that isn't acceptable to reuse here. This
 * instead hands the model a pre-fetched, already-scoped snapshot as plain
 * context — the model never decides what data to read.
 */
export async function askCoFounder(
  businessName: string,
  snapshotData: SupplierRevenueAnalytics,
  history: CoFounderTurn[],
  message: string,
): Promise<CoFounderReply> {
  if (!isGatewayConfigured()) {
    return {
      reply:
        "The AI advisor isn't configured yet in this environment — ask your team to wire up the AI gateway to enable it.",
      tokensUsed: 0,
    };
  }

  const snapshot = summarizeForAdvisor(snapshotData);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT(businessName, snapshot) },
    // Cap history so the prompt doesn't grow unbounded over a long session.
    ...history.slice(-12).map((t): ChatMessage => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  try {
    const { content, tokensUsed } = await chat("reasoning", messages, {
      temperature: 0.5,
      maxTokens: 700,
      timeoutMs: 15000,
    });
    return { reply: content, tokensUsed };
  } catch {
    return {
      reply: "I couldn't reach the AI advisor just now — try again in a moment.",
      tokensUsed: 0,
    };
  }
}
