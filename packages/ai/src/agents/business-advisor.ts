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
    ].join(" "),
  });
}
