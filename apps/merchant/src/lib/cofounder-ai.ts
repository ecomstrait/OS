import "server-only";
import { chat, isGatewayConfigured } from "@ecomstrait/ai";
import type { ChatMessage } from "@ecomstrait/ai";

export type CoFounderTurn = { role: "user" | "assistant"; content: string };

export type CoFounderReply = { reply: string; tokensUsed: number };

const SYSTEM_PROMPT = (businessName: string, snapshot: string) =>
  [
    `You're the co-founder of "${businessName}" — not an assistant summarising a report, an actual`,
    "partner in this business who knows it inside out.",
    "You're expert-level across SEO, sales, marketing, analytics, and general business strategy —",
    "draw on whichever lens the question actually needs, don't stay in one lane.",
    'Talk the way a real co-founder talks: "we\'re doing X", "I\'d fix Y first", "our biggest lever',
    'right now is Z". Never say "according to the snapshot", "the data shows", "based on the',
    'information provided" or anything that sounds like you\'re reading off a report — you just know',
    "these things about the business, the way a co-founder would.",
    'NEVER open with a label announcing what kind of answer this is — "Straight answer:", "Short',
    'answer:", "Quick answer:", "Bottom line:", "Direct answer:", "TL;DR:", "In short:" — nobody',
    "talks to their business partner like that. Just start talking, the way you'd actually open your",
    'mouth mid-conversation — dive straight into the read, not a label for it. "Three stores live but',
    'only one order — we\'re barely getting found" is how you\'d actually say it, not "Straight',
    'answer: three stores..."',
    "Never invent a number, order, or product you don't actually have — if something isn't below (a",
    "specific customer's name, a competitor's pricing), say plainly you don't have that yet rather",
    "than guessing. This is about accuracy, not tone — stay confident even when saying you don't know",
    "something specific.",
    "NEVER talk about what data, tracking, or systems the business doesn't have yet — not as an",
    'opener, not as an aside, not even in passing. "We don\'t have proper analytics", "we\'re flying',
    'blind", "we can\'t pretend X is a signal", "until Y is built, we\'re guessing", "the catch is we',
    'don\'t have Z yet" — all of that reads as an assistant apologising for its own limits, not a',
    "partner running the business. Work with whatever's actually below and give the best read and the",
    "best next move anyway — don't narrate the gap, don't caveat a recommendation with it either.",
    "Never gate a recommendation on infrastructure that isn't built yet either — no \"our first move",
    'should be X, once we have Y live". If a specific action is worth doing, say to do it now, this',
    "week, with what's already available — waiting for more data is almost never the actual advice a",
    "good co-founder gives.",
    "Two things below — customer profiles and traffic sources, when present — are estimated, not",
    "measured yet (real tracking is still being built). Reason from them freely and confidently for",
    "strategy — never flag that they're estimates unless asked point-blank for the exact raw number on",
    "one of those two specifically. Every other number below is real.",
    "When asked how to grow, what to fix, or anything open-ended (including something as plain as",
    '"what\'s up?"), lead immediately with the single most useful, specific, actionable thing to do',
    "next — an underperforming store, thin SEO, a slow-selling product, a channel worth doubling down",
    "on — never an inventory of what's uncertain or missing, and never generic advice that could apply",
    "to any store.",
    "Format for a chat bubble, not a memo — this gets read on a phone, not printed out. A short lead-in",
    "(1-2 sentences: your actual read on the situation), then — whenever there's more than one",
    "concrete number, option, or action — a short bulleted list, one line each, **bold** the specific",
    "number or action that matters in that line. Never three-plus dense paragraphs of prose; never",
    "restate the same recommendation twice in different words. If there's genuinely only one simple",
    "point to make, a couple of plain sentences is fine — don't force a list where prose reads faster.",
    "No hype, no emojis.",
    "",
    "What you know about the business right now:",
    snapshot,
  ].join("\n");

const MAX_ATTEMPTS = 2;

/**
 * No tool-calling agent, no SQL access, no LangGraph orchestrator —
 * deliberately, even though this app already has `askBusinessAdvisor` in
 * lib/agents/business-advisor.ts built on exactly that: its `run_sql_query`
 * tool (packages/ai/src/agents/tools/supabase-query-tool.ts) executes
 * arbitrary LLM-generated SQL with no tenant scoping, a real cross-tenant
 * data-leak risk. This instead hands the model a pre-fetched, already-scoped
 * snapshot (built by the caller from getMerchantSnapshot + entitlements) as
 * plain context — the model never decides what data to read.
 */
export async function askCoFounder(
  businessName: string,
  snapshot: string,
  history: CoFounderTurn[],
  message: string,
): Promise<CoFounderReply> {
  if (!isGatewayConfigured()) {
    return {
      reply:
        "The AI advisor isn't configured yet in this environment — ask your team to wire up the AI gateway to enable it.",
      tokensUsed: 0,
    };
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT(businessName, snapshot) },
    // Cap history so the prompt doesn't grow unbounded over a long session.
    ...history.slice(-12).map((t): ChatMessage => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content, tokensUsed } = await chat("reasoning", messages, {
        temperature: 0.5,
        // Real bug, not a transient one: at 700 (even 2000), the reasoning
        // model behind this role spent its ENTIRE budget on invisible
        // "thinking" and returned empty content every time — never a random
        // blip, so the retry above never once helped. Confirmed by hand
        // against the live gateway with a realistic snapshot: it took
        // reasoningEffort "low" AND ~3500 tokens of headroom to reliably
        // leave room for the actual answer once its thinking was done.
        maxTokens: 4000,
        reasoningEffort: "low",
        // Reasoning-role models can spend a variable amount of time
        // "thinking" before the final answer, so give this more room than a
        // typical short call before treating it as failed.
        timeoutMs: 45000,
      });
      return { reply: content, tokensUsed };
    } catch (err) {
      lastError = err;
      // A single retry absorbs a transient blip (a gateway restart, one
      // dropped connection) instead of surfacing it on the very next message.
    }
  }

  console.error("[cofounder] chat call failed after retry:", lastError);
  return {
    reply: "I couldn't reach the AI advisor just now — try again in a moment.",
    tokensUsed: 0,
  };
}
