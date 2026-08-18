/**
 * EcomAI store-plan generator. Groq/Llama with a deterministic preset fallback.
 * Returns a plan plus the token count (for metering).
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

/** A media reference in a plan. `url` is absolute — CDN, bucket, or embed. */
export type PlanMedia = {
  url: string;
  kind: "image" | "video";
  alt?: string;
};

/**
 * An editable content block. Themes render what they support and skip the
 * rest, so adding a type here never breaks a store built on an older theme.
 */
export type PlanSection = {
  id: string;
  type: "text" | "image" | "video" | "gallery" | "features";
  heading?: string;
  body?: string;
  media?: PlanMedia[];
  items?: { title: string; description: string }[];
};

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
  /** Everything below is optional: stores built before the content editor
   *  existed have none of it, and must keep rendering unchanged. */
  announcement?: string;
  heroMedia?: PlanMedia | null;
  aboutMedia?: PlanMedia | null;
  sections?: PlanSection[];
  footerText?: string;
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
/**
 * The plan fields EcomAI is allowed to write.
 *
 * Everything else on a plan is either derived (`source`) or owned by the
 * merchant through the media library — the model has no way to know an
 * uploaded asset's URL, so anything it invented for `heroMedia` or a section
 * would 404 on a live store.
 */
const EDITABLE = [
  "storeName", "tagline", "brandColors", "heroHeadline", "heroSub", "about",
  "collections", "seoTitle", "seoDescription", "announcement", "footerText",
] as const;

type EditableField = (typeof EDITABLE)[number];

export type MerchantReply = {
  plan: StorePlan;
  /** What EcomAI says back. Never empty. */
  reply: string;
  /** Fields actually changed, for the caller to summarise or log. */
  changed: EditableField[];
  tokensUsed: number;
};

/** Human labels, so a fallback summary reads like a sentence. */
const FIELD_LABEL: Record<EditableField, string> = {
  storeName: "store name", tagline: "tagline", brandColors: "brand colours",
  heroHeadline: "hero headline", heroSub: "hero subheading", about: "about text",
  collections: "collections", seoTitle: "SEO title", seoDescription: "SEO description",
  announcement: "announcement bar", footerText: "footer note",
};

function isHexList(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0
    && v.every((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c.trim()));
}

/**
 * Copy the model's proposed changes onto the plan, field by field.
 *
 * A patch rather than a whole-plan replacement, because a replacement is what
 * silently dropped merchants' media and content sections: any key the model
 * omitted vanished. Here an omitted key simply isn't touched, and a value of
 * the wrong shape is discarded rather than written.
 */
function applyChanges(
  plan: StorePlan,
  changes: Record<string, unknown>,
): { plan: StorePlan; changed: EditableField[] } {
  const next: StorePlan = { ...plan };
  const changed: EditableField[] = [];

  for (const field of EDITABLE) {
    if (!(field in changes)) continue;
    const value = changes[field];

    if (field === "brandColors") {
      if (!isHexList(value)) continue;
      const colors = value.map((c) => c.trim()).slice(0, 3);
      if (JSON.stringify(colors) === JSON.stringify(plan.brandColors)) continue;
      next.brandColors = colors;
      changed.push(field);
      continue;
    }

    if (field === "collections") {
      if (!Array.isArray(value) || !value.every((c) => typeof c === "string")) continue;
      const list = (value as string[]).map((c) => c.trim()).filter(Boolean).slice(0, 5);
      if (!list.length || JSON.stringify(list) === JSON.stringify(plan.collections)) continue;
      next.collections = list;
      changed.push(field);
      continue;
    }

    if (typeof value !== "string") continue;
    const text = value.trim();
    // The announcement bar and footer note are the only fields a merchant can
    // legitimately clear by asking, so an empty string means something there.
    const clearable = field === "announcement" || field === "footerText";
    if (!text && !clearable) continue;
    if (text === (plan[field] ?? "")) continue;
    next[field] = text;
    changed.push(field);
  }

  return { plan: next, changed };
}

/** "the tagline and the brand colours" */
function listFields(fields: EditableField[]): string {
  const names = fields.map((f) => FIELD_LABEL[f]);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const MERCHANT_SYSTEM = [
  "You are EcomAI, an ecommerce co-founder helping a merchant with their store.",
  "",
  "Reply with JSON only, shaped exactly:",
  '{ "intent": "edit" | "question" | "unsupported", "reply": "...", "changes": { } }',
  "",
  '"edit"        they asked you to change the store. Put ONLY the fields you are',
  "              changing in changes — omit every field you are leaving alone.",
  '"question"    they asked something. Answer it in reply. changes must be empty.',
  '"unsupported" they want something you cannot do from here (adding products,',
  "              uploading images, prices, shipping, payments, domains). Say so",
  "              plainly and point them at the right part of the dashboard.",
  "",
  "Fields allowed in changes:",
  "  storeName, tagline, heroHeadline, heroSub, about, seoTitle, seoDescription,",
  "  announcement, footerText  - strings",
  '  brandColors               - array of 1-3 hex colours like "#0f172a"',
  "  collections               - array of up to 5 short category names",
  "",
  "You cannot change images, video or content sections; the merchant manages",
  "those under Content. If asked, say that rather than inventing a URL.",
  "",
  "reply is spoken to the merchant: one or two sentences, first person, and",
  'specific about what you actually changed. Never reply with just "updated".',
].join("\n");

/**
 * Handle a merchant's message: apply what they asked for, and say what happened.
 *
 * Replaces a version that always returned a whole plan and left the caller to
 * print a fixed "Updated — check the preview." It could not answer a question,
 * could not tell the merchant what it had done, and silently no-opped on
 * anything outside nine cosmetic fields.
 */
export async function applyMerchantRequest(
  plan: StorePlan,
  instruction: string,
): Promise<MerchantReply> {
  const key = process.env.GROQ_API_KEY;
  const text = instruction.trim();
  if (text.length < 2) {
    return { plan, reply: "Tell me what you'd like to change.", changed: [], tokensUsed: 0 };
  }
  const cfg = groqConfig();
  if (!key || !cfg) {
    return {
      plan,
      reply:
        "I can't reach the AI service right now, so nothing has changed. You can still edit everything by hand under Content.",
      changed: [],
      tokensUsed: 200,
    };
  }

  // The model can't act on media or sections, so sending them spends context
  // the instruction and the plan's text fields need.
  const visible: Record<string, unknown> = {};
  for (const f of EDITABLE) if (plan[f] !== undefined) visible[f] = plan[f];

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...cfg,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: MERCHANT_SYSTEM },
          { role: "user", content: `Current store:\n${JSON.stringify(visible)}\n\nMerchant says: ${text}` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`groq ${res.status}`);

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    const tokensUsed: number = data?.usage?.total_tokens ?? 500;
    if (!content) throw new Error("empty completion");

    const parsed = JSON.parse(content) as {
      intent?: string;
      reply?: string;
      changes?: Record<string, unknown>;
    };

    const intent =
      parsed.intent === "question" || parsed.intent === "unsupported" ? parsed.intent : "edit";
    const modelReply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";

    // A question must never mutate the store, whatever the model returned
    // alongside its answer.
    if (intent !== "edit") {
      return {
        plan,
        reply: modelReply || "I'm not sure how to help with that one — could you rephrase it?",
        changed: [],
        tokensUsed,
      };
    }

    const { plan: updated, changed } = applyChanges(plan, parsed.changes ?? {});

    // Trust the diff over the model's account of itself. Claiming success when
    // nothing valid came back is a lie the merchant finds in the preview.
    if (!changed.length) {
      const vague = !modelReply || /^(updated|done|ok)\b/i.test(modelReply);
      return {
        plan,
        reply: vague
          ? 'I couldn\'t tell what to change from that — try naming the part of the store, like "make the headline shorter" or "use a deep green".'
          : modelReply,
        changed: [],
        tokensUsed,
      };
    }

    return {
      plan: { ...updated, source: "groq" },
      reply: modelReply || `Updated the ${listFields(changed)}.`,
      changed,
      tokensUsed,
    };
  } catch {
    return {
      plan,
      reply:
        "That didn't go through — the AI service didn't answer in time. Nothing was changed, so try again in a moment.",
      changed: [],
      tokensUsed: 200,
    };
  }
}

export async function generateStorePlan(
  idea: string,
  productTitles: string[],
): Promise<{ plan: StorePlan; tokensUsed: number }> {
  const key = process.env.GROQ_API_KEY;
  if (!key || idea.trim().length < 2) return { plan: presetPlan(idea), tokensUsed: 400 };
  const cfg = groqConfig();
  if (!cfg) return { plan: presetPlan(idea), tokensUsed: 400 };

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
        ...cfg,
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
