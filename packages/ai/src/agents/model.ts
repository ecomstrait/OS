import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import { resolveModel } from "../roles";
import type { ModelRole } from "../types";

/**
 * A LangChain chat model bound to one of our roles, talking to the AI
 * gateway — never a vendor SDK directly. `ChatOpenAI` is used here only
 * because it's a client for any OpenAI-compatible endpoint (which the
 * gateway is, via `configuration.baseURL`); it does not mean this is bound
 * to OpenAI's actual API, and the resolved model can be anything the
 * gateway's own config maps the role to — including a self-hosted model.
 */
export function createChatModel(
  role: ModelRole,
  opts: { temperature?: number; reasoningEffort?: "none" | "low" | "medium" | "high" } = {},
): ChatOpenAI {
  const baseURL = process.env.AI_GATEWAY_URL?.trim();
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!baseURL || !apiKey) {
    throw new Error("[ai] AI_GATEWAY_URL / AI_GATEWAY_API_KEY not set.");
  }
  return new ChatOpenAI({
    model: resolveModel(role),
    apiKey,
    temperature: opts.temperature ?? 0.3,
    configuration: { baseURL },
    // `modelKwargs` merges straight into the request body LangChain sends —
    // this is how a provider-specific param like `reasoning_effort` reaches
    // the gateway from here. See `gateway.ts`'s own note: a reasoning-
    // capable model behind a role not expecting deep thought can otherwise
    // spend its whole token budget "thinking" and return nothing.
    ...(opts.reasoningEffort ? { modelKwargs: { reasoning_effort: opts.reasoningEffort } } : {}),
  });
}
