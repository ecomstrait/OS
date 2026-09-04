import "server-only";
import { createAdminClient } from "@ecomstrait/db";
import { chat, isGatewayConfigured } from "../gateway";

/**
 * Durable memory for the real user-to-agent chats — merchant Co-Founder,
 * supplier Co-Founder, and the Store Builder chat — so coming back to one
 * actually continues it instead of starting cold every time. Deliberately
 * does NOT cover any agent-to-agent exchange (e.g. Co-Founder delegating to
 * the Business Advisor as a tool) — only what the user actually typed and
 * was shown ever lands here.
 *
 * One shared table (`ai_chat_threads`), one shared module, reused by all
 * three surfaces — the schema and the load/append/summarize logic are
 * identical regardless of which chat it is; only `agent`/`threadKey` differ
 * (the user's own id for a Co-Founder chat — one thread per whole
 * portfolio; a store's id for a Builder chat — one thread per store,
 * spanning both its pre-launch draft conversation and its post-launch edit
 * conversation, since a store keeps the same id across that promotion).
 */
export type ChatThreadMessage = {
  role: "user" | "assistant";
  content: string;
  at?: string;
  /** See `ChatMessage.reasoningContent` (packages/ai/src/types.ts) — carried
   *  through storage so a reasoning-capable model's chain-of-thought survives
   *  a reload and replays correctly on the next turn, instead of quietly
   *  degrading every time a chat is reopened. */
  reasoningContent?: string;
  providerSpecificFields?: Record<string, unknown>;
};
export type ChatAgent = "merchant_cofounder" | "supplier_cofounder" | "merchant_builder";

const MAX_MESSAGES = 30;
/** Below this, the raw messages alone already tell the whole story — not
 *  worth spending a model call on a summary nothing has outgrown yet. */
const MIN_MESSAGES_FOR_FIRST_SUMMARY = 6;

/**
 * The persisted thread, or an empty one if none exists yet (a genuinely new
 * conversation) or the read failed for any reason — a broken history load
 * must never be why a chat can't open. `createAdminClient()` only: this
 * table is service-role-only (RLS enabled, no policies), same posture as
 * every other `ai_*` table — never touched by a session-scoped client.
 */
export async function loadChatThread(params: {
  tenantId: string;
  agent: ChatAgent;
  threadKey: string;
}): Promise<{ messages: ChatThreadMessage[]; summary: string | null }> {
  const empty = { messages: [], summary: null };
  const admin = createAdminClient();
  if (!admin) return empty;

  try {
    const { data, error } = await admin
      .from("ai_chat_threads")
      .select("messages, summary")
      .eq("tenant_id", params.tenantId)
      .eq("agent", params.agent)
      .eq("thread_key", params.threadKey)
      .maybeSingle();
    if (error) {
      console.error("[ai] chat thread read failed, starting fresh:", error.message);
      return empty;
    }
    if (!data) return empty;
    return { messages: (data.messages ?? []) as ChatThreadMessage[], summary: data.summary ?? null };
  } catch (err) {
    console.error("[ai] chat thread read threw, starting fresh:", err);
    return empty;
  }
}

/**
 * Append one or more turns (Builder's very first save, once a store id
 * exists, hands over the whole opening conversation at once; every other
 * caller appends a single user+assistant pair) and trim to the last 30.
 *
 * When trimming actually drops something — or a summary has never been
 * generated yet and there's enough conversation to be worth one — the
 * summary is refreshed before returning, folding in whatever's being kept
 * or dropped so a trimmed-away exchange is never silently lost, just
 * compressed. This runs in-line (awaited), not fire-and-forget: it's a
 * single cheap `fast-cheap` call, it only actually fires occasionally (not
 * every turn), and `packages/ai` has no framework-specific "run this after
 * the response" primitive of its own — accepting the occasional extra
 * second here is simpler and more portable than pushing that plumbing onto
 * every one of this function's callers.
 *
 * Never throws: a history-saving failure is a convenience lost, not a
 * reason to break the chat the user is actually waiting on.
 */
export async function appendChatTurns(params: {
  tenantId: string;
  agent: ChatAgent;
  threadKey: string;
  turns: ChatThreadMessage[];
}): Promise<void> {
  if (!params.turns.length) return;
  const admin = createAdminClient();
  if (!admin) return;

  try {
    const { data } = await admin
      .from("ai_chat_threads")
      .select("messages, summary")
      .eq("tenant_id", params.tenantId)
      .eq("agent", params.agent)
      .eq("thread_key", params.threadKey)
      .maybeSingle();

    const existing = (data?.messages ?? []) as ChatThreadMessage[];
    const stamped = params.turns.map((t) => ({ ...t, at: t.at ?? new Date().toISOString() }));
    const combined = [...existing, ...stamped];

    const dropped = combined.length > MAX_MESSAGES ? combined.slice(0, combined.length - MAX_MESSAGES) : [];
    const kept = combined.slice(-MAX_MESSAGES);

    let summary = data?.summary ?? null;
    const needsFirstSummary = !summary && kept.length >= MIN_MESSAGES_FOR_FIRST_SUMMARY;
    if (dropped.length > 0 || needsFirstSummary) {
      summary = await refreshSummary(summary, dropped.length > 0 ? dropped : kept);
    }

    const { error } = await admin.from("ai_chat_threads").upsert(
      {
        tenant_id: params.tenantId,
        agent: params.agent,
        thread_key: params.threadKey,
        messages: kept,
        summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,agent,thread_key" },
    );
    if (error) console.error("[ai] failed to save chat thread (non-fatal):", error.message);
  } catch (err) {
    console.error("[ai] chat thread append threw (non-fatal):", err);
  }
}

const SUMMARY_SYSTEM = [
  "You maintain a short running summary of an ongoing chat between a user and an AI business",
  "assistant, so the assistant can pick the conversation back up later without re-reading the",
  "whole transcript.",
  "Fold the previous summary (if any) together with the messages below into ONE updated summary,",
  "3-5 sentences, plain prose, no headings or bullet points.",
  "Focus on what would actually help resuming this conversation: the business/store being",
  "discussed, concrete facts stated, decisions made, and anything left open or unresolved — never",
  "a blow-by-blow transcript recap, never small talk.",
  "If the previous summary already covers something these messages don't change, keep it; only",
  "add or revise what's actually new.",
].join("\n");

async function refreshSummary(previous: string | null, messages: ChatThreadMessage[]): Promise<string | null> {
  if (!isGatewayConfigured()) return previous;
  try {
    const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const { content } = await chat(
      "fast-cheap",
      [
        { role: "system", content: SUMMARY_SYSTEM },
        {
          role: "user",
          content: `Previous summary: ${previous ?? "(none yet)"}\n\nMessages:\n${transcript}`,
        },
      ],
      { temperature: 0.2, maxTokens: 300, timeoutMs: 10000, reasoningEffort: "none" },
    );
    return content.trim() || previous;
  } catch (err) {
    console.error("[ai] chat summary refresh failed (non-fatal, keeping previous):", err);
    return previous;
  }
}
