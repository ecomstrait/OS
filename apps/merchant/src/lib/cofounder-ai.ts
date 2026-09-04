/**
 * Only the shared conversation-turn shape lives here now — the actual
 * Co-Founder logic (persona prompt, tool-calling loop) moved to
 * `lib/agents/cofounder-orchestrator.ts` when Co-Founder became an
 * orchestrator with real tools (suggest products, build/edit/launch a
 * store, delegate to the Business Advisor) instead of a plain prompt
 * completion over a static snapshot. See `Docs/prompts/merchant-cofounder-chat.md`
 * for the current prompt and why this file used to hold it.
 */
export type CoFounderTurn = { role: "user" | "assistant"; content: string };
