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

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 800,
      ...(opts.responseFormatJson ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  });

  if (!res.ok) {
    throw new Error(`[ai] gateway chat ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("[ai] gateway returned no content");

  return { content, model, tokensUsed: data?.usage?.total_tokens ?? 0 };
}

export async function embed(texts: string[]): Promise<EmbeddingResult[]> {
  const baseUrl = gatewayUrl();
  const apiKey = gatewayKey();
  if (!baseUrl || !apiKey) {
    throw new Error("[ai] AI_GATEWAY_URL / AI_GATEWAY_API_KEY not set.");
  }
  const model = resolveModel("embeddings");

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: texts }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`[ai] gateway embeddings ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  const rows: { embedding: number[] }[] = data?.data ?? [];
  return rows.map((r) => ({ vector: r.embedding, model, dimension: r.embedding.length }));
}
