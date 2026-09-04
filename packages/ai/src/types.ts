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
  /**
   * A reasoning-capable model's chain-of-thought for THIS assistant turn
   * (DeepSeek "thinking mode" and similar) — only ever set on a `role:
   * "assistant"` message, and only meaningful there. Ignored for `system`/
   * `user` messages and by a non-reasoning model.
   *
   * The provider requires this replayed verbatim on every subsequent request
   * that includes this turn in history, or it silently degrades multi-turn
   * quality (observed via the gateway's own LiteLLM proxy: "assistant
   * message is missing `reasoning_content` ... A single-space placeholder is
   * being injected"). A caller building `history` for a follow-up `chat()`
   * call must carry this through from the `ChatResult`/stored turn that
   * produced it — see `gateway.ts`'s `chat()`, which reads it back off the
   * response and serializes it back onto the wire when present here.
   */
  reasoningContent?: string;
  /** Any other provider-specific fields the gateway echoed back alongside
   *  `reasoning_content` (e.g. a provider's own opaque reasoning-signature) —
   *  same replay requirement as `reasoningContent` above. */
  providerSpecificFields?: Record<string, unknown>;
};

export type ChatOptions = {
  temperature?: number;
  /**
   * Maps to the provider's max output tokens. For a reasoning-capable model
   * behind the `reasoning` role, this is shared with its internal "thinking"
   * tokens — a low value here can let a hard question consume the entire
   * budget on invisible reasoning and return empty `content`, which `chat()`
   * treats as a failure. Leave real headroom above what the visible answer
   * needs when the role might resolve to a reasoning model, and consider
   * `reasoningEffort` too.
   */
  maxTokens?: number;
  /** Ask for a JSON-only completion (OpenAI-compatible `response_format`). */
  responseFormatJson?: boolean;
  timeoutMs?: number;
  /**
   * Caps how much a reasoning-capable model "thinks" before answering
   * (OpenAI-compatible `reasoning_effort`). No-op on a model that isn't a
   * reasoning model. Omit for the model's own default — which, for at least
   * one reasoning model seen behind the `reasoning` role, was high enough to
   * spend an entire generous token budget thinking and never emit an answer.
   */
  reasoningEffort?: "none" | "low" | "medium" | "high";
};

export type ChatResult = {
  content: string;
  /** The resolved model alias actually used — for cost/audit logging. */
  model: string;
  tokensUsed: number;
  /** See `ChatMessage.reasoningContent` — set when the model returned one for
   *  this reply. A caller that persists/replays this turn as history (a chat
   *  thread, a multi-turn conversation array) must carry this through onto
   *  that stored/replayed assistant message, or a reasoning-capable model
   *  behind the role silently loses its chain-of-thought on the next turn. */
  reasoningContent?: string;
  providerSpecificFields?: Record<string, unknown>;
};

export type EmbeddingResult = {
  vector: number[];
  model: string;
  dimension: number;
};
