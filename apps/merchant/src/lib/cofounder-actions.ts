"use server";

import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { chat, isGatewayConfigured, getOrComputeSnapshot } from "@ecomstrait/ai";
import { getMerchantSnapshot, summarizeMerchantForAdvisor, type MerchantSnapshot } from "@/lib/cofounder-snapshot";
import { askCoFounder, type CoFounderTurn } from "@/lib/cofounder-ai";
import { askBusinessAdvisor } from "@/lib/agents/business-advisor";
import { getEntitlements, assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";
import { PLAN_ENTITLEMENTS } from "@ecomstrait/db";

/** Recomputing revenue/orders/customers/traffic on every message was real,
 *  repeated work — see snapshot-cache.ts. Business data moves fast enough
 *  that a forever-cache (like store_category_content) would go stale
 *  quickly, so this is a short TTL, not a "generate once" cache. */
const SNAPSHOT_TTL_MS = 15 * 60 * 1000;

/**
 * Does this message clearly ask about ONE of the merchant's specific
 * stores? If so, name it — the caller then routes to the tool-grounded
 * advisor scoped to that store instead of the broad snapshot. A cheap,
 * single-word classification, same role/shape as the orchestrator's own
 * router (packages/ai/src/agents/orchestrator.ts) — this is deliberately
 * NOT that orchestrator's router itself, since this decision (broad vs.
 * one-store) happens one layer above it, before the orchestrator's own
 * advisor-vs-analytics routing ever runs.
 */
async function detectStoreTarget(
  message: string,
  stores: { id: string; name: string }[],
): Promise<string | null> {
  if (!stores.length || !isGatewayConfigured()) return null;
  try {
    const { content } = await chat(
      "fast-cheap",
      [
        {
          role: "system",
          content:
            "Given a merchant's message and a list of their store names, decide whether the message is " +
            "clearly asking about ONE SPECIFIC store by name (or an unambiguous nickname of one) — not a " +
            "general question about the whole business, growth, or strategy. " +
            `Store names: ${stores.map((s) => s.name).join(", ")}. ` +
            'Reply with ONLY the exact store name from that list if confident, or the single word "none".',
        },
        { role: "user", content: message },
      ],
      { temperature: 0, maxTokens: 20, timeoutMs: 8000, reasoningEffort: "none" },
    );
    const answer = content.trim().toLowerCase();
    return stores.find((s) => s.name.toLowerCase() === answer)?.id ?? null;
  } catch (err) {
    console.error("[cofounder] store-target classification failed, staying on the broad snapshot:", err);
    return null;
  }
}

export async function askCoFounderAction(
  history: CoFounderTurn[],
  message: string,
): Promise<{ reply: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const text = message.trim();
  if (!text) return { error: "Say something first." };

  const budget = await assertTokenBudget(700);
  if (!budget.ok) return { error: budget.error };

  const [{ data: profile }, { data: storeRows }, entitlements] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("stores").select("id, name").eq("user_id", user.id),
    getEntitlements(),
  ]);

  // A question naming one specific store gets a real, tool-grounded answer
  // from that store's own Business Advisor (live Shopify/DB access) instead
  // of the broad cross-store snapshot below — same orchestrator `editStore`
  // used to call directly; it now lives here instead (Docs/prompts —
  // Builder stopped answering business questions; Co-Founder does).
  const stores = (storeRows ?? []).filter((s): s is { id: string; name: string } => Boolean(s.name));
  const storeId = await detectStoreTarget(text, stores);
  if (storeId) {
    try {
      const advisor = await askBusinessAdvisor({ tenantId: user.id, storeId, message: text });
      return { reply: advisor.reply };
    } catch (err) {
      console.error("[cofounder] store-specific advisor failed, falling back to the broad snapshot:", err);
      // Fall through — a broad-but-real answer beats a dead end.
    }
  }

  const admin = createAdminClient();
  const snapshot = await getOrComputeSnapshot<MerchantSnapshot>("merchant", user.id, SNAPSHOT_TTL_MS, () =>
    getMerchantSnapshot(supabase, admin, user.id),
  );
  const planLine = `Plan: ${PLAN_ENTITLEMENTS[entitlements.plan].label} (${entitlements.storesUsed}/${entitlements.storeLimit} stores used, ${entitlements.tokensRemaining.toLocaleString()} AI tokens left today).`;
  const digest = [summarizeMerchantForAdvisor(snapshot), planLine].join("\n");

  const result = await askCoFounder(profile?.full_name || "your business", digest, history, text);
  await recordTokenUsage(result.tokensUsed);
  return { reply: result.reply };
}
