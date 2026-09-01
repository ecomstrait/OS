/**
 * Starter prompts surfaced as chips in the "Ask EcomAI" chat UI.
 *
 * Deliberately its own file, not part of `@/lib/ask` — that module imports
 * `@ecomstrait/ai`, which (transitively, via its agents/mcp exports) pulls
 * in Node-only packages like `pg`. A client component importing even one
 * value from `@/lib/ask` used to drag that whole graph into the browser
 * bundle and fail the build trying to resolve `net`/`tls` for the browser.
 * This file has zero imports, so it's safe for any client component to use.
 */
export const ASK_SUGGESTIONS = [
  "How does EcomAI build my store?",
  "Do I need inventory or suppliers?",
  "Can I use my own domain?",
  "How much does it cost?",
  "How long until I can launch?",
];
