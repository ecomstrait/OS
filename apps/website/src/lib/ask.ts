import "server-only";

/**
 * "Ask EcomAI" engine — a conversational FAQ assistant.
 *
 * Two implementations behind one facade:
 *   - `presetAnswer` — deterministic best-match over the FAQ knowledge base.
 *                      Always on, instant, zero-dependency.
 *   - `aiAnswer`     — the "workhorse" role via the AI gateway
 *                      (`@ecomstrait/ai`), grounded in the same KB. Falls
 *                      back to preset on any error/timeout/missing config.
 *
 * The gateway means this file never names a vendor or a model — see
 * `Docs/AI-Native-Migration-Plan.md`.
 *
 * Answers are on-brand and honest — features roll out in beta, numbers are
 * example ranges, never presented as live data.
 */

import { chat, isGatewayConfigured } from "@ecomstrait/ai";
import { homeFaqs } from "@/content/faqs";
import { siteConfig } from "@/lib/site";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };
export type AskResult = { answer: string; source: "preset" | "groq" };

/** Extra brand facts the model can lean on beyond the FAQ list. */
const BRAND_FACTS = [
  "EcomStrait is the company; EcomAI is its AI ecommerce co-founder.",
  "EcomAI can build a store, find verified suppliers, write SEO and product copy, run marketing, and suggest profitable niches — all from a plain-language prompt.",
  "The product is rolling out in beta; visitors can join the Founders Waitlist.",
  `Contact: ${siteConfig.email}. WhatsApp: ${siteConfig.whatsapp}.`,
].join(" ");

/* ------------------------------------------------------------------ */
/*  Preset engine (deterministic best-match)                           */
/* ------------------------------------------------------------------ */

const STOP = new Set([
  "the", "a", "an", "to", "do", "i", "is", "it", "of", "and", "or", "for",
  "on", "in", "my", "me", "you", "can", "how", "what", "does", "with", "are",
  "will", "be", "get", "your", "we", "our",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function presetAnswer(question: string): AskResult {
  const qt = tokens(question);
  let best = -1;
  let bestIdx = -1;
  homeFaqs.forEach((f, i) => {
    const hay = tokens(`${f.question} ${f.answer}`);
    const score = qt.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0), 0);
    if (score > best) {
      best = score;
      bestIdx = i;
    }
  });

  if (best <= 0 || bestIdx < 0) {
    return {
      answer:
        "Great question — I'm your AI co-founder for building an online business. I can explain how EcomAI builds your store, finds suppliers, writes SEO, and helps you launch. Ask me anything, or join the Founders Waitlist to get early access.",
      source: "preset",
    };
  }
  return { answer: homeFaqs[bestIdx].answer, source: "preset" };
}

/* ------------------------------------------------------------------ */
/*  AI engine (workhorse role, via the gateway)                        */
/* ------------------------------------------------------------------ */

function systemPrompt(): string {
  const kb = homeFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  return [
    "You are EcomAI, a friendly, concise AI ecommerce co-founder answering",
    "questions on the EcomStrait marketing site. Rules:",
    "- Answer in 1-3 short sentences, warm and confident, no hype, no emojis.",
    "- Ground every answer in the knowledge base below; do not invent features,",
    "  prices, or statistics. Any numbers are EXAMPLE ranges, never live data.",
    "- The product is in beta — when relevant, invite the visitor to join the",
    "  Founders Waitlist. If a question is off-topic, gently steer back to how",
    "  EcomAI helps them build and grow an online business.",
    "",
    `Brand facts: ${BRAND_FACTS}`,
    "",
    "Knowledge base:",
    kb,
  ].join("\n");
}

async function aiAnswer(messages: ChatMessage[]): Promise<AskResult | null> {
  if (!isGatewayConfigured()) return null;

  // Keep the last few turns for context; cap length.
  const history = messages
    .slice(-6)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, 500),
    }));

  try {
    const { content } = await chat(
      "workhorse",
      [{ role: "system", content: systemPrompt() }, ...history],
      { temperature: 0.5, maxTokens: 220, timeoutMs: 8000 },
    );
    if (!content.trim()) return null;
    return { answer: content.trim(), source: "groq" };
  } catch (err) {
    console.error("[ask/ai] chat threw:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Facade                                                             */
/* ------------------------------------------------------------------ */

export async function askEcomAI(messages: ChatMessage[]): Promise<AskResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const viaAi = await aiAnswer(messages);
  return viaAi ?? presetAnswer(lastUser?.content ?? "");
}
