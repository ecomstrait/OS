import "server-only";

import { chat } from "../gateway";

export type RestockInput = {
  productTitle: string;
  /** Already reflects the triggering sale — the platform decrements stock
   *  on order recording, before this check ever runs. Not a pre-sale value
   *  for this function to subtract `quantitySold` from itself. */
  currentStock: number;
  lowStockThreshold: number;
  /** Units sold in the order that triggered this check — context for the
   *  reasoning (e.g. "was this a demand spike?"), not an amount to net out
   *  of `currentStock`. */
  quantitySold: number;
};

export type RestockDecision = {
  shouldRestock: boolean;
  /** 0 when shouldRestock is false. */
  quantity: number;
  reasoning: string;
};

/**
 * Single-shot restock decision — no tools, no multi-turn conversation, so
 * this goes straight through the gateway rather than through LangGraph's
 * agent machinery. Used by the n8n-triggered restock check
 * (apps/merchant/src/app/api/n8n/restock-check/route.ts): fast-cheap role,
 * since this runs on every order and needs to be cheap and fast, not deep.
 */
export async function decideRestock(input: RestockInput): Promise<RestockDecision> {
  const system = [
    "You are EcomAI's inventory planner. Given a product's stock level and a",
    "sale that just happened, decide whether to recommend a restock and how much.",
    "Be conservative: only recommend a restock when stock is at or below the",
    "low-stock threshold, or the sale itself pushed it there.",
    "You are only given a single snapshot — current stock, the low-stock threshold, and the units sold",
    "in the one order that triggered this check. You have NO sales-velocity history (units/day or",
    "units/week over time) and NO supplier lead-time data. Any quantity you pick is therefore a rough",
    "heuristic gap-filler (e.g. topping back up to somewhere above the threshold), not a demand forecast —",
    'your "reasoning" text MUST say so in plain terms (e.g. "rough estimate based on current stock and',
    'this one sale, not a demand forecast — no sales history or lead time was available") so the human',
    "approver reading it doesn't mistake it for something more rigorous than it is. Never state the",
    "quantity with more confidence than that.",
    "Respond with ONLY a JSON object using these exact keys:",
    "{",
    '  "shouldRestock": boolean,',
    '  "quantity": number,   // 0 if shouldRestock is false',
    '  "reasoning": string   // one sentence, must flag this as a limited-signal heuristic estimate',
    "}",
  ].join("\n");

  const user = [
    `Product: ${input.productTitle}`,
    `Current stock (already reflects the sale below): ${input.currentStock}`,
    `Low-stock threshold: ${input.lowStockThreshold}`,
    `Units sold in the order that triggered this check: ${input.quantitySold}`,
  ].join("\n");

  try {
    const { content } = await chat(
      "fast-cheap",
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // maxTokens bumped slightly from 200: the reasoning sentence now must
      // explicitly name this as a limited-signal heuristic, not a forecast.
      { temperature: 0, maxTokens: 300, responseFormatJson: true, timeoutMs: 8000 },
    );
    const parsed = JSON.parse(content) as Partial<RestockDecision>;
    return {
      shouldRestock: Boolean(parsed.shouldRestock),
      quantity: typeof parsed.quantity === "number" && parsed.quantity > 0 ? Math.round(parsed.quantity) : 0,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    };
  } catch (err) {
    // Fails closed: no recommendation rather than a guessed one. A missed
    // restock alert is recoverable; a fabricated one wastes a supplier's time.
    console.error("[ai] restock decision failed:", err);
    return { shouldRestock: false, quantity: 0, reasoning: "" };
  }
}
