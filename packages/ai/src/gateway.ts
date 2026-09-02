import "server-only";

/**
 * The one place in the whole system that makes an AI HTTP call.
 *
 * Talks to a self-hosted LiteLLM proxy over its OpenAI-compatible API — never
 * to Anthropic, OpenAI, Groq, or any provider directly. Every provider
 * account, key, and vendor model id lives only in the proxy's own config
 * (`AI-Native-Manual-Setup.md`); this file and every caller of it know
 * nothing about which vendor is behind a role.
 */

import { resolveModel } from "./roles";
import type { ChatMessage, ChatOptions, ChatResult, EmbeddingResult, ModelRole } from "./types";

function gatewayUrl(): string | null {
  const url = process.env.AI_GATEWAY_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

function gatewayKey(): string | null {
  return process.env.AI_GATEWAY_API_KEY?.trim() || null;
}

/**
 * A bounded, log-safe summary of a chat request — enough to see what was
 * actually asked (role, params, and a preview of the last message) without
 * dumping a merchant's full store data or a long conversation into logs on
 * every failure. Used only on the error paths below, never on success.
 */
function summarizeChatRequest(
  role: ModelRole,
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions,
): Record<string, unknown> {
  const last = messages[messages.length - 1];
  return {
    role,
    model,
    messageCount: messages.length,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens ?? 800,
    reasoningEffort: opts.reasoningEffort ?? null,
    responseFormatJson: Boolean(opts.responseFormatJson),
    timeoutMs: opts.timeoutMs ?? 15000,
    lastMessage: last ? `${last.role}: ${last.content.slice(0, 300)}${last.content.length > 300 ? "…" : ""}` : null,
  };
}

/** Cheap presence check so call sites can no-op the same way they did when `GROQ_API_KEY` was unset. */
export function isGatewayConfigured(): boolean {
  return Boolean(gatewayUrl() && gatewayKey());
}

export async function chat(
  role: ModelRole,
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<ChatResult> {
  const baseUrl = gatewayUrl();
  const apiKey = gatewayKey();
  if (!baseUrl || !apiKey) {
    throw new Error("[ai] AI_GATEWAY_URL / AI_GATEWAY_API_KEY not set.");
  }
  const model = resolveModel(role);
  const request = summarizeChatRequest(role, model, messages, opts);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 800,
        ...(opts.responseFormatJson ? { response_format: { type: "json_object" } } : {}),
        ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
        messages,
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
    });
  } catch (err) {
    // A network error or the AbortSignal timeout firing — no HTTP response
    // to inspect at all. Log what was asked so a timeout can be told apart
    // from "the gateway host is unreachable" without reproducing the call.
    console.error("[ai] gateway chat request failed — asked:", request, "error:", err);
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Logged in full here (not just thrown) because the thrown message is
    // what call sites' own catch blocks usually collapse into a generic
    // merchant-facing string — the real vendor error (a 429 credits-
    // depleted message, a 400 unsupported-param message, etc.) would
    // otherwise never reach anywhere a human actually looks.
    console.error(`[ai] gateway chat ${res.status} — asked:`, request, "response:", body.slice(0, 2000));
    throw new Error(`[ai] gateway chat ${res.status}: ${body}`);
  }
  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    // A reasoning-capable model can spend its ENTIRE `max_tokens` budget on
    // invisible "thinking" and emit no visible answer at all — that reads
    // identically to a dead gateway from the caller's side otherwise. This
    // surfaced as "[ai] gateway returned no content" with nothing to explain
    // it until someone reproduced the exact call by hand; the finish reason
    // and reasoning-token count below is what would have shown it instantly.
    const finishReason = data?.choices?.[0]?.finish_reason;
    const reasoningTokens = data?.usage?.completion_tokens_details?.reasoning_tokens;
    console.error(
      "[ai] gateway returned no content — asked:",
      request,
      "got:",
      { finishReason, reasoningTokens, usage: data?.usage },
    );
    throw new Error(
      `[ai] gateway returned no content (finish_reason=${finishReason ?? "?"}, reasoning_tokens=${
        reasoningTokens ?? "?"
      }/${data?.usage?.completion_tokens ?? "?"} completion tokens) — likely the reasoning role's model spent its` +
        " whole maxTokens budget \"thinking\"; raise maxTokens and/or pass a lower reasoningEffort.",
    );
  }

  return { content, model, tokensUsed: data?.usage?.total_tokens ?? 0 };
}

export async function embed(texts: string[]): Promise<EmbeddingResult[]> {
  const baseUrl = gatewayUrl();
  const apiKey = gatewayKey();
  if (!baseUrl || !apiKey) {
    throw new Error("[ai] AI_GATEWAY_URL / AI_GATEWAY_API_KEY not set.");
  }
  const model = resolveModel("embeddings");
  const request = { model, textCount: texts.length, firstTextPreview: texts[0]?.slice(0, 300) ?? null };

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    console.error("[ai] gateway embeddings request failed — asked:", request, "error:", err);
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[ai] gateway embeddings ${res.status} — asked:`, request, "response:", body.slice(0, 2000));
    throw new Error(`[ai] gateway embeddings ${res.status}: ${body}`);
  }
  const data = await res.json();
  const rows: { embedding: number[] }[] = data?.data ?? [];
  return rows.map((r) => ({ vector: r.embedding, model, dimension: r.embedding.length }));
}
