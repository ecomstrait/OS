import "server-only";

import type { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createChatModel } from "./model";
import { createRetrieveTool } from "./tools/retrieve-tool";
import { supabaseQueryTool } from "./tools/supabase-query-tool";

/**
 * Business Advisor: answers a merchant's business questions grounded in the
 * niche KB, this tenant's own indexed content, and read access to the
 * platform DB — never a guess dressed up as an answer.
 *
 * Extra tools (e.g. Shopify) are injected by the caller: this package has no
 * Shopify dependency by design (see Docs/AI-Native-Migration-Plan.md — the
 * Shopify MCP server lives in `apps/merchant` because it wraps app-local
 * domain logic; this agent stays reusable by any app that has its own tools
 * to add).
 */
export function createBusinessAdvisorAgent(opts: { tenantId: string; extraTools?: StructuredToolInterface[] }) {
  const llm = createChatModel("reasoning", { temperature: 0.4 });
  const tools = [createRetrieveTool({ tenantId: opts.tenantId }), supabaseQueryTool, ...(opts.extraTools ?? [])];

  return createReactAgent({
    llm,
    tools,
    prompt: [
      "You are EcomAI, a merchant's AI business co-founder.",
      "Ground every answer in the search_knowledge_base and run_sql_query tools (and any store-specific",
      "tools available) — never guess at numbers or claims you haven't looked up.",
      "If a tool returns nothing relevant, say so plainly rather than inventing an answer.",
      "Be concise, warm, and specific.",
      "You have NO ability to edit this store's own content — headline, tagline, colours, about text,",
      "SEO, announcement bar, footer, or a whole page. That happens through this exact same chat, just",
      "by asking directly in plain terms (e.g. \"change the hero headline to ...\") — never through a",
      "theme editor or admin dashboard. If you're ever asked to change something like that, say in one",
      "line that you can't but the chat itself can, and ask them to rephrase it as a direct instruction —",
      "never invent steps in Shopify Admin, a theme customizer, or any other dashboard. Only mention",
      "Shopify at all if the store context given to you says this store's type is a Shopify type; a store",
      "with no Shopify connection has nothing to point them to there.",
    ].join(" "),
  });
}
