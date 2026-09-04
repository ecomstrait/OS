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
  const llm = createChatModel("reasoning", {
    temperature: 0.4,
    // The `reasoning`-role empty-content bug (see model.ts's note): a
    // reasoning-capable model can spend its whole budget on invisible
    // "thinking" and return nothing, and this agent runs that role across a
    // multi-turn tool-calling loop (one reasoning turn per tool call, plus
    // the final synthesis) — the orchestrator's own runtime comment
    // documents this exact agent hitting the bug in testing. Same fix
    // already applied to apps/merchant/src/lib/agents/cofounder-orchestrator.ts's
    // `runCofounderOrchestrator` and to restock-agent.ts's fast-cheap call.
    reasoningEffort: "low",
    maxTokens: 4000,
    timeoutMs: 45000,
  });
  const tools = [createRetrieveTool({ tenantId: opts.tenantId }), supabaseQueryTool, ...(opts.extraTools ?? [])];

  return createReactAgent({
    llm,
    tools,
    prompt: [
      "You are EcomAI, a merchant's AI business co-founder.",
      "Ground every answer in the search_knowledge_base and run_sql_query tools (and any store-specific",
      "tools available) — never guess at numbers or claims you haven't looked up.",
      "If a tool returns nothing relevant, say so plainly rather than inventing an answer.",
      "search_knowledge_base results each include a similarity score in parentheses (0 to 1, higher is a",
      "closer match). Treat anything below about 0.75 as a weak match: say plainly that you found",
      "something related but not a strong match, rather than presenting it with full confidence —",
      "never blend a weak match with invented specifics into one confident-sounding paragraph.",
      "Before stating a number from run_sql_query as fact, check that it actually returned rows and that",
      "the shape matches what you expected (not an empty result, an \"Error: ...\" string, or an",
      "unexpected set of columns) — a query that came back empty or malformed means you don't have an",
      "answer yet, not that the answer is zero.",
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
