"use server";

import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";
import { getMerchantSnapshot, summarizeMerchantForAdvisor } from "@/lib/cofounder-snapshot";
import { askCoFounder, type CoFounderTurn } from "@/lib/cofounder-ai";
import { getEntitlements, assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";
import { PLAN_ENTITLEMENTS } from "@ecomstrait/db";

export async function askCoFounderAction(
  history: CoFounderTurn[],
  message: string,
): Promise<{ reply: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  if (!message.trim()) return { error: "Say something first." };

  const budget = await assertTokenBudget(700);
  if (!budget.ok) return { error: budget.error };

  const [{ data: profile }, entitlements] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    getEntitlements(),
  ]);

  const admin = createAdminClient();
  const snapshot = await getMerchantSnapshot(supabase, admin, user.id);
  const planLine = `Plan: ${PLAN_ENTITLEMENTS[entitlements.plan].label} (${entitlements.storesUsed}/${entitlements.storeLimit} stores used, ${entitlements.tokensRemaining.toLocaleString()} AI tokens left today).`;
  const digest = [summarizeMerchantForAdvisor(snapshot), planLine].join("\n");

  const result = await askCoFounder(profile?.full_name || "your business", digest, history, message.trim());
  await recordTokenUsage(result.tokensUsed);
  return { reply: result.reply };
}
