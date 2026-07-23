/**
 * EcomAI store-plan generator. Groq/Llama with a deterministic preset fallback.
 * Returns a plan plus the token count (for metering).
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export type StorePlan = {
  storeName: string;
  tagline: string;
  brandColors: string[];
  heroHeadline: string;
  heroSub: string;
  about: string;
  collections: string[];
  seoTitle: string;
  seoDescription: string;
  source: "groq" | "preset";
};

function presetPlan(idea: string): StorePlan {
  const clean = idea.trim().replace(/\.$/, "");
  const name = clean.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ") || "Your Store";
  return {
    storeName: name,
    tagline: `Premium ${clean.toLowerCase()}, delivered.`,
    brandColors: ["#0f172a", "#10b981", "#3b82f6"],
    heroHeadline: `Discover ${clean}`,
    heroSub: `Curated ${clean.toLowerCase()} for people who care about quality.`,
    about: `We started ${name} to make great ${clean.toLowerCase()} easy to find and love. Every product is chosen for quality, value, and the experience it brings.`,
    collections: ["Best Sellers", "New Arrivals", "Featured"],
    seoTitle: `${name} — Shop ${clean}`,
    seoDescription: `Shop curated ${clean.toLowerCase()} at ${name}. Quality products, fast shipping, and a store built by AI.`,
    source: "preset",
  };
}

/** Map a free-text style answer to one of our themes. */
export function themeForStyle(style?: string): string {
  const s = (style ?? "").toLowerCase();
  if (/lux|premium|high.?end|gold|elegant/.test(s)) return "noir";
  if (/play|fun|bright|color|bold.?fun|vibrant/.test(s)) return "bloom";
  if (/calm|editorial|magazine|soft|story/.test(s)) return "cove";
  if (/bold|industrial|street|gear|rugged/.test(s)) return "forge";
  if (/marble|refined|timeless|neutral/.test(s)) return "marble";
  return "aurora"; // modern / minimal default
}

/** Apply a cosmetic change (colors/text) to an existing plan. */
export async function refineStorePlan(
  plan: StorePlan,
  instruction: string,
): Promise<{ plan: StorePlan; tokensUsed: number }> {
  const key = process.env.GROQ_API_KEY;
  if (!key || instruction.trim().length < 2) return { plan, tokensUsed: 200 };
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const system = [
    "You are EcomAI editing an existing store plan. Apply ONLY the requested",
    "cosmetic change (colors, wording, tone). Keep everything else the same.",
    "Return the FULL updated JSON with these exact keys:",
    '{ "storeName","tagline","brandColors","heroHeadline","heroSub","about","collections","seoTitle","seoDescription" }',
  ].join("\n");

  const user = `Current plan JSON:\n${JSON.stringify({ ...plan, source: undefined })}\n\nChange to apply: ${instruction}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { plan, tokensUsed: 200 };
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    const tokensUsed: number = data?.usage?.total_tokens ?? 500;
    if (!content) return { plan, tokensUsed };
    const p = JSON.parse(content) as Partial<StorePlan>;
    return {
      plan: {
        storeName: p.storeName || plan.storeName,
        tagline: p.tagline || plan.tagline,
        brandColors: Array.isArray(p.brandColors) && p.brandColors.length ? p.brandColors.slice(0, 3) : plan.brandColors,
        heroHeadline: p.heroHeadline || plan.heroHeadline,
        heroSub: p.heroSub || plan.heroSub,
        about: p.about || plan.about,
        collections: Array.isArray(p.collections) && p.collections.length ? p.collections.slice(0, 5) : plan.collections,
        seoTitle: p.seoTitle || plan.seoTitle,
        seoDescription: p.seoDescription || plan.seoDescription,
        source: "groq",
      },
      tokensUsed,
    };
  } catch {
    return { plan, tokensUsed: 200 };
  }
}

export async function generateStorePlan(
  idea: string,
  productTitles: string[],
): Promise<{ plan: StorePlan; tokensUsed: number }> {
  const key = process.env.GROQ_API_KEY;
  if (!key || idea.trim().length < 2) return { plan: presetPlan(idea), tokensUsed: 400 };
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const system = [
    "You are EcomAI, building an online store for an entrepreneur.",
    "Given a business idea and their selected products, return a concise, on-brand",
    "store plan. Warm, confident, no hype, no emojis in text fields.",
    "Respond with ONLY JSON using these exact keys:",
    "{",
    '  "storeName": string,',
    '  "tagline": string,',
    '  "brandColors": string[],      // 3 hex colors',
    '  "heroHeadline": string,',
    '  "heroSub": string,',
    '  "about": string,              // 2-3 sentences',
    '  "collections": string[],      // 3-5 names',
    '  "seoTitle": string,',
    '  "seoDescription": string',
    "}",
  ].join("\n");

  const user = `Business idea: ${idea}\nSelected products: ${
    productTitles.slice(0, 20).join(", ") || "(none yet)"
  }`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { plan: presetPlan(idea), tokensUsed: 400 };
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    const tokensUsed: number = data?.usage?.total_tokens ?? 800;
    if (!content) return { plan: presetPlan(idea), tokensUsed };
    const p = JSON.parse(content) as Partial<StorePlan>;
    const base = presetPlan(idea);
    return {
      plan: {
        storeName: p.storeName || base.storeName,
        tagline: p.tagline || base.tagline,
        brandColors: Array.isArray(p.brandColors) && p.brandColors.length ? p.brandColors.slice(0, 3) : base.brandColors,
        heroHeadline: p.heroHeadline || base.heroHeadline,
        heroSub: p.heroSub || base.heroSub,
        about: p.about || base.about,
        collections: Array.isArray(p.collections) && p.collections.length ? p.collections.slice(0, 5) : base.collections,
        seoTitle: p.seoTitle || base.seoTitle,
        seoDescription: p.seoDescription || base.seoDescription,
        source: "groq",
      },
      tokensUsed,
    };
  } catch {
    return { plan: presetPlan(idea), tokensUsed: 400 };
  }
}
