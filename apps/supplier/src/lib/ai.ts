/**
 * Product enrichment for suppliers — same posture as the website's EcomAI
 * engine: Groq-hosted Llama when a key is present, otherwise a deterministic
 * template. Server-only. Output is a suggestion the supplier can edit/accept.
 */

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
  };
}

export async function enrichProduct(input: EnrichInput): Promise<Enrichment> {
  const key = process.env.GROQ_API_KEY;
  if (!key || !input.title.trim()) return presetEnrichment(input);
  const cfg = groqConfig();
  if (!cfg) return presetEnrichment(input);

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
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...cfg,
        temperature: 0.6,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return presetEnrichment(input);
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return presetEnrichment(input);
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
    };
  } catch {
    return presetEnrichment(input);
  }
}
