/**
 * Shared AI types. Nothing here names a vendor or a model — that's the
 * point. Callers ask for a role; the gateway resolves it to whatever model
 * is configured behind it.
 */

/** A capability tier, not a model. See roles.ts for the env var behind each. */
export type ModelRole = "reasoning" | "workhorse" | "fast-cheap" | "embeddings";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  temperature?: number;
  /** Maps to the provider's max output tokens. */
  maxTokens?: number;
  /** Ask for a JSON-only completion (OpenAI-compatible `response_format`). */
  responseFormatJson?: boolean;
  timeoutMs?: number;
};

export type ChatResult = {
  content: string;
  /** The resolved model alias actually used — for cost/audit logging. */
  model: string;
  tokensUsed: number;
};

export type EmbeddingResult = {
  vector: number[];
  model: string;
  dimension: number;
};
