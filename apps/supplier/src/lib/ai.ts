import "server-only";

/**
 * Product enrichment for suppliers — same posture as the website's EcomAI
 * engine: the "workhorse" role via the AI gateway (`@ecomstrait/ai`) when
 * configured, otherwise a deterministic template. Server-only. Output is a
 * suggestion the supplier can edit/accept.
 *
 * Goes through the gateway — this file never names a vendor or a model. See
 * `Docs/AI-Native-Migration-Plan.md`.
 */

import { chat, isGatewayConfigured } from "@ecomstrait/ai";

export type EnrichInput = {
  title: string;
  category?: string;
  wholesalePrice?: number;
};

export type Enrichment = {
  description: string;
  seoTitle: string;
  seoDescription: string;
  suggestedRetailPrice: number | null;
  source: "groq" | "preset";
  /** Actual tokens spent on this call (0 for the deterministic fallback) —
   *  the caller records this against the supplier's daily AI-token usage. */
  tokensUsed: number;
};

function presetEnrichment(input: EnrichInput): Enrichment {
  const cat = input.category?.toLowerCase() || "product";
  const retail =
    typeof input.wholesalePrice === "number" && input.wholesalePrice > 0
      ? Math.round(input.wholesalePrice * 1.8 * 100) / 100
      : null;
  return {
    description: `${input.title} — a quality ${cat} sourced for resale. Durable, well-made, and ready to ship, it's a dependable addition to any store's ${cat} range. Sold at wholesale with healthy retail margins.`,
    seoTitle: `${input.title} | Wholesale ${input.category ?? "Supply"}`,
    seoDescription: `Buy ${input.title} at wholesale. Reliable ${cat} with fast fulfilment and strong margins for online stores.`,
    suggestedRetailPrice: retail,
    source: "preset",
    tokensUsed: 0,
  };
}

export async function enrichProduct(input: EnrichInput): Promise<Enrichment> {
  if (!isGatewayConfigured() || !input.title.trim()) return presetEnrichment(input);

  const system = [
    "You are EcomAI, helping a wholesale supplier list a product.",
    "Write concise, honest, conversion-friendly copy. No hype, no emojis.",
    "Respond with ONLY a JSON object using these exact keys:",
    "{",
    '  "description": string,        // 2-3 sentences',
    '  "seoTitle": string,           // <= 60 chars',
    '  "seoDescription": string,     // <= 155 chars',
    '  "suggestedRetailPrice": number // a sensible retail price, or 0 if unknown',
    "}",
  ].join("\n");

  const user = `Product: ${input.title}${input.category ? ` · category: ${input.category}` : ""}${
    input.wholesalePrice ? ` · wholesale price: $${input.wholesalePrice}` : ""
  }`;

  try {
    const { content, tokensUsed } = await chat(
      "workhorse",
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // reasoningEffort: "none" — a reasoning-capable model can otherwise
      // spend the entire maxTokens budget "thinking" and return empty
      // content (see @ecomstrait/ai's gateway.ts); this role is meant to be
      // fast and general-purpose, never a deep thinker.
      { temperature: 0.6, maxTokens: 500, responseFormatJson: true, timeoutMs: 8000, reasoningEffort: "none" },
    );
    const p = JSON.parse(content) as Partial<Enrichment> & { suggestedRetailPrice?: number };
    const base = presetEnrichment(input);
    const price =
      typeof p.suggestedRetailPrice === "number" && p.suggestedRetailPrice > 0
        ? Math.round(p.suggestedRetailPrice * 100) / 100
        : base.suggestedRetailPrice;
    return {
      description: typeof p.description === "string" ? p.description : base.description,
      seoTitle: typeof p.seoTitle === "string" ? p.seoTitle : base.seoTitle,
      seoDescription:
        typeof p.seoDescription === "string" ? p.seoDescription : base.seoDescription,
      suggestedRetailPrice: price,
      source: "groq",
      tokensUsed,
    };
  } catch {
    return presetEnrichment(input);
  }
}
