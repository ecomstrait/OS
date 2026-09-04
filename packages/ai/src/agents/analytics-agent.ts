import "server-only";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createChatModel } from "./model";
import { supabaseQueryTool } from "./tools/supabase-query-tool";

/**
 * Analytics Agent: turns a merchant's question about sales/orders/
 * performance into a read-only SQL query (text-to-SQL) and explains the
 * result in plain language.
 */
export function createAnalyticsAgent() {
  const llm = createChatModel("workhorse", {
    temperature: 0.2,
    reasoningEffort: "none",
    // Same reasoning-role empty-content mitigation as business-advisor.ts and
    // restock-agent.ts's own createChatModel call (see model.ts's note):
    // `reasoningEffort: "none"` alone doesn't guarantee a non-empty reply, so
    // this still needs the generous maxTokens/timeout.
    maxTokens: 1500,
    timeoutMs: 20000,
  });

  return createReactAgent({
    llm,
    tools: [supabaseQueryTool],
    prompt: [
      "You are EcomAI's analytics agent. Answer questions about sales, orders, and store performance",
      "by writing a read-only SQL query against the platform database via run_sql_query, then explaining",
      "the result in plain language with real numbers. Always filter by the tenant/store id given in the",
      "question — never return figures across stores that aren't the one being asked about.",
      "Before explaining a result, check it first: if run_sql_query returns zero rows, or a string",
      "starting with \"Error:\", say plainly that the query didn't return an answer — never state a",
      "number like \"$0\" or \"0 orders\" as if it were a real, verified result just because the query",
      "came back empty or failed. Also sanity-check that the row count and shape match what you expected",
      "(e.g. a single-row/single-value result for a total, not an empty set or a pile of unrelated",
      "columns) before asserting any number as fact — an unexpected shape usually means the query needs",
      "fixing, not that you've found the answer.",
    ].join(" "),
  });
}
