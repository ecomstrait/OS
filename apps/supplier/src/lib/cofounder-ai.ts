import "server-only";
import { chat, isGatewayConfigured } from "@ecomstrait/ai";
import type { ChatMessage } from "@ecomstrait/ai";

export type CoFounderTurn = { role: "user" | "assistant"; content: string };

export type CoFounderReply = { reply: string; tokensUsed: number };

const SYSTEM_PROMPT = (businessName: string, snapshot: string) =>
  [
    `You are this supplier's AI co-founder — a sharp, pragmatic advisor for their wholesale/dropshipping business "${businessName}" on EcomStrait.`,
    "The business snapshot below covers: catalog size and stock levels, product categories, quality score, requests/inbox, revenue, order status and COD/prepaid mix, credit holds, wallet balance, and top products by revenue. Answer questions about any of that directly from it.",
    "Give concrete, specific advice grounded ONLY in the snapshot — never invent numbers, orders, or products that aren't in it. If something isn't in the snapshot (e.g. a specific customer name, a competitor's pricing), say plainly you don't have that data rather than guessing.",
    "When asked how to grow, what to fix, or anything open-ended, proactively point to specific things in the snapshot — low stock, orders on hold, a slow category, a weak quality-score factor — rather than generic advice.",
    "Keep replies focused and actionable: 2-5 short paragraphs or a short list, not a wall of text. No hype, no emojis.",
    "",
    "Current business snapshot:",
    snapshot,
  ].join("\n");

const MAX_ATTEMPTS = 2;

/**
 * No tool-calling agent, no SQL access, no LangGraph orchestrator —
 * deliberately: the merchant app's equivalent (`askBusinessAdvisor`) uses a
 * `run_sql_query` tool that executes arbitrary LLM-generated SQL with no
 * tenant scoping (packages/ai/src/agents/tools/supabase-query-tool.ts), a
 * real cross-tenant data-leak risk that isn't acceptable to reuse here. This
 * instead hands the model a pre-fetched, already-scoped snapshot (built by
 * the caller from getSupplierRevenueAnalytics + getSupplierAnalytics) as
 * plain context — the model never decides what data to read.
 */
export async function askCoFounder(
  businessName: string,
  snapshot: string,
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

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT(businessName, snapshot) },
    // Cap history so the prompt doesn't grow unbounded over a long session.
    ...history.slice(-12).map((t): ChatMessage => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content, tokensUsed } = await chat("reasoning", messages, {
        temperature: 0.5,
        // Real bug, not a transient one: at 700 (even 2000), the reasoning
        // model behind this role spent its ENTIRE budget on invisible
        // "thinking" and returned empty content every time — never a random
        // blip, so the retry above never once helped. Confirmed by hand
        // against the live gateway with a realistic snapshot: it took
        // reasoningEffort "low" AND ~3500 tokens of headroom to reliably
        // leave room for the actual answer once its thinking was done.
        maxTokens: 4000,
        reasoningEffort: "low",
        // Reasoning-role models can spend a variable amount of time
        // "thinking" before the final answer; 15s was tight enough to
        // plausibly abort on a slower response with zero visibility into
        // why (the failure was previously swallowed with no logging at all).
        timeoutMs: 45000,
      });
      return { reply: content, tokensUsed };
    } catch (err) {
      lastError = err;
      // A single retry absorbs a transient blip (a gateway restart, one
      // dropped connection) instead of surfacing it to the supplier as a
      // dead advisor on the very next message.
    }
  }

  // Logged, not swallowed — this was the actual bug: any real failure
  // (timeout, gateway 5xx, network error) previously vanished into a bare
  // catch with a generic message and nothing in server logs to diagnose it.
  console.error("[cofounder] chat call failed after retry:", lastError);
  return {
    reply: "I couldn't reach the AI advisor just now — try again in a moment.",
    tokensUsed: 0,
  };
}
