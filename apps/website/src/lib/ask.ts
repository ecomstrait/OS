/**
 * "Ask EcomAI" engine — a conversational FAQ assistant.
 *
 * Two implementations behind one facade:
 *   - `presetAnswer` — deterministic best-match over the FAQ knowledge base.
 *                      Always on, instant, zero-dependency.
 *   - `groqAnswer`   — Groq-hosted Llama for natural conversation, grounded in
 *                      the same KB. Falls back to preset on any error/timeout.
 *
 * Answers are on-brand and honest — features roll out in beta, numbers are
 * example ranges, never presented as live data.
 */

import { homeFaqs } from "@/content/faqs";
import { siteConfig } from "@/lib/site";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };
export type AskResult = { answer: string; source: "preset" | "groq" };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

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
/*  Groq / Llama engine                                                */
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

async function groqAnswer(messages: ChatMessage[]): Promise<AskResult | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  // Keep the last few turns for context; cap length.
  const history = messages
    .slice(-6)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, 500),
    }));

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 220,
        messages: [{ role: "system", content: systemPrompt() }, ...history],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[ask/groq]", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) return null;
    return { answer: content.trim(), source: "groq" };
  } catch (err) {
    console.error("[ask/groq] threw:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Facade                                                             */
/* ------------------------------------------------------------------ */

export async function askEcomAI(messages: ChatMessage[]): Promise<AskResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const viaGroq = await groqAnswer(messages);
  return viaGroq ?? presetAnswer(lastUser?.content ?? "");
}

/** Starter prompts surfaced as chips in the UI. */
export const ASK_SUGGESTIONS = [
  "How does EcomAI build my store?",
  "Do I need inventory or suppliers?",
  "Can I use my own domain?",
  "How much does it cost?",
  "How long until I can launch?",
];
