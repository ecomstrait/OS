/**
 * EcomAI engine — turns a business idea into a structured, LABELED "build plan".
 *
 * One facade, two implementations behind it:
 *   - `presetPlan`  — deterministic, grounded in the niche KB. Always on.
 *   - `groqPlan`    — Groq-hosted Llama (dynamic). Falls back to preset on any
 *                     error / missing key / timeout.
 *
 * Output is illustrative (a simulated preview) — never presented as live data.
 */

import { matchNiche, type Niche } from "@/content/niches";

export type PlanInput = { idea: string; country?: string; budget?: string };
export type BuildStep = { at: string; label: string };

export type BusinessPlan = {
  idea: string;
  niche: string;
  emoji: string;
  headline: string;
  supplierRange: string;
  marginRange: string;
  monthlyRevenueRange: string;
  productIdeas: string[];
  targetCountries: string[];
  buildSteps: BuildStep[];
  growthSuggestions: string[];
  storeSlug?: string;
  /** Theme folder names in the themes bucket for this niche (may be several). */
  themes: string[];
  /** Whether the matched niche has a live preview (vs. beta / coming soon). */
  available: boolean;
  /** Raw numeric ranges (grounded in the KB) for the business simulator. */
  estimate: {
    revenue: [number, number];
    margin: [number, number];
    suppliers: [number, number];
  };
  disclaimer: string;
  source: "preset" | "groq";
};

const DISCLAIMER = "Simulated preview — example figures, not live data.";

/** The canonical 00:00 → 00:50 build timeline (shared by both engines). */
export const BUILD_STEPS: BuildStep[] = [
  { at: "00:00", label: "Understanding your idea" },
  { at: "00:05", label: "Finding verified suppliers" },
  { at: "00:10", label: "Importing products" },
  { at: "00:15", label: "Building your brand & logo" },
  { at: "00:20", label: "Writing SEO" },
  { at: "00:25", label: "Generating your homepage" },
  { at: "00:30", label: "Building collections" },
  { at: "00:35", label: "Creating the mobile version" },
  { at: "00:40", label: "Configuring payments & shipping" },
  { at: "00:45", label: "Optimizing for conversion" },
  { at: "00:50", label: "Store ready" },
];

const GROWTH = ["Bundle offers", "One-click upsells", "Subscription model"];

function fmtK(v: number): string {
  return v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
}

function withCountry(country: string | undefined, base: string[]): string[] {
  if (!country) return base.slice(0, 3);
  return [country, ...base.filter((c) => c.toLowerCase() !== country.toLowerCase())].slice(0, 3);
}

/* ------------------------------------------------------------------ */
/*  Preset engine (deterministic, always available)                    */
/* ------------------------------------------------------------------ */

export function presetPlan(input: PlanInput): BusinessPlan {
  const n = matchNiche(input.idea);
  return {
    idea: input.idea.trim(),
    niche: n.label,
    emoji: n.emoji,
    headline: `Great choice — ${n.label.toLowerCase()} has real potential. Here's the business I'd build for you.`,
    supplierRange: `${n.suppliers[0]}–${n.suppliers[1]} verified suppliers`,
    marginRange: `${n.margin[0]}–${n.margin[1]}% avg. margin`,
    monthlyRevenueRange: `${fmtK(n.monthlyRevenue[0])}–${fmtK(n.monthlyRevenue[1])}/mo`,
    productIdeas: n.productIdeas,
    targetCountries: withCountry(input.country, n.countries),
    buildSteps: BUILD_STEPS,
    growthSuggestions: GROWTH,
    storeSlug: n.storeSlug,
    themes: n.themes ?? [],
    available: Boolean(n.themes && n.themes.length),
    estimate: { revenue: n.monthlyRevenue, margin: n.margin, suppliers: n.suppliers },
    disclaimer: DISCLAIMER,
    source: "preset",
  };
}

/* ------------------------------------------------------------------ */
/*  Groq / Llama engine                                                */
/* ------------------------------------------------------------------ */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/**
 * Groq request configuration, taken entirely from the environment.
 *
 * There is deliberately no model constant to fall back on. Groq withdraws
 * models without notice, and while this file hardcoded one that had already
 * been retired, every call returned 404 and the catch below quietly served
 * the preset instead — the feature looked alive while producing canned output.
 * An unset GROQ_MODEL now short-circuits to the same preset, but says so in
 * the logs, so the failure is diagnosable rather than invisible.
 *
 * GROQ_REASONING_EFFORT is optional and left out of the request when unset:
 * reasoning models need it so hidden reasoning doesn't consume max_tokens,
 * and models that don't reason reject the field outright. Keeping it in the
 * environment means switching model never requires a code change.
 */
function groqConfig(): { model: string; reasoning_effort?: string } | null {
  const model = process.env.GROQ_MODEL?.trim();
  if (!model) {
    console.error("[groq] GROQ_MODEL is not set — falling back to the preset.");
    return null;
  }
  const effort = process.env.GROQ_REASONING_EFFORT?.trim();
  return effort ? { model, reasoning_effort: effort } : { model };
}

function systemPrompt(n: Niche): string {
  return [
    "You are EcomAI, an AI ecommerce co-founder. A visitor tells you what they",
    "want to sell; you reply with a concise, confident, believable *simulated*",
    "business plan. This is a marketing preview, so:",
    "- All numbers are EXAMPLE RANGES, never presented as live/real data.",
    "- Stay grounded in the reference data below; do not invent wilder figures.",
    "- Be warm and concise. No hype, no emojis in text fields.",
    "",
    `Reference niche: ${n.label}`,
    `- margin: ${n.margin[0]}–${n.margin[1]}%`,
    `- suppliers: ${n.suppliers[0]}–${n.suppliers[1]}`,
    `- monthly revenue: ${fmtK(n.monthlyRevenue[0])}–${fmtK(n.monthlyRevenue[1])}`,
    `- product ideas (SHAPE ONLY, do not copy): ${n.productIdeas.join(", ")}`,
    `- typical countries: ${n.countries.join(", ")}`,
    "",
    // Without this the model treats the reference ideas as grounding and
    // echoes them back, so a visitor who typed "handmade ceramic mugs" was
    // shown "Hero Product, Everyday Bestseller, Premium Bundle, Gift Set".
    // The numbers genuinely are reference data; the product names are not.
    "The reference product ideas show the KIND of line-up to suggest — four",
    "tiers from hero to gift. Never repeat them. Name four products that",
    "actually belong to what the visitor said they want to sell.",
    "",
    "Respond with ONLY a JSON object using these exact keys:",
    "{",
    '  "headline": string,            // one warm sentence',
    '  "marginRange": string,         // e.g. "42–58% avg. margin"',
    '  "supplierRange": string,       // e.g. "25–60 verified suppliers"',
    '  "monthlyRevenueRange": string, // e.g. "$3k–$12k/mo"',
    '  "productIdeas": string[],      // exactly 4',
    '  "targetCountries": string[],   // exactly 3',
    '  "growthSuggestions": string[]  // exactly 3',
    "}",
  ].join("\n");
}

async function groqPlan(input: PlanInput): Promise<BusinessPlan | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const cfg = groqConfig();
  if (!cfg) return null;
  const n = matchNiche(input.idea);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...cfg,
        temperature: 0.7,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(n) },
          {
            role: "user",
            content: `I want to sell: ${input.idea}${
              input.country ? ` · country: ${input.country}` : ""
            }${input.budget ? ` · budget: ${input.budget}` : ""}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[groq]", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const p = JSON.parse(content) as Partial<BusinessPlan>;

    // Coerce into a full, safe BusinessPlan (fall back to preset per-field).
    const base = presetPlan(input);
    return {
      ...base,
      headline: typeof p.headline === "string" ? p.headline : base.headline,
      marginRange: typeof p.marginRange === "string" ? p.marginRange : base.marginRange,
      supplierRange: typeof p.supplierRange === "string" ? p.supplierRange : base.supplierRange,
      monthlyRevenueRange:
        typeof p.monthlyRevenueRange === "string" ? p.monthlyRevenueRange : base.monthlyRevenueRange,
      productIdeas: Array.isArray(p.productIdeas) && p.productIdeas.length ? p.productIdeas.slice(0, 6) : base.productIdeas,
      targetCountries:
        Array.isArray(p.targetCountries) && p.targetCountries.length ? p.targetCountries.slice(0, 3) : base.targetCountries,
      growthSuggestions:
        Array.isArray(p.growthSuggestions) && p.growthSuggestions.length ? p.growthSuggestions.slice(0, 4) : base.growthSuggestions,
      source: "groq",
    };
  } catch (err) {
    console.error("[groq] threw:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Facade                                                             */
/* ------------------------------------------------------------------ */

export async function generateBusinessPlan(input: PlanInput): Promise<BusinessPlan> {
  const viaGroq = await groqPlan(input);
  return viaGroq ?? presetPlan(input);
}
