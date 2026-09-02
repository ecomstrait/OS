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
  const llm = createChatModel("workhorse", { temperature: 0.2, reasoningEffort: "none" });

  return createReactAgent({
    llm,
    tools: [supabaseQueryTool],
    prompt: [
      "You are EcomAI's analytics agent. Answer questions about sales, orders, and store performance",
      "by writing a read-only SQL query against the platform database via run_sql_query, then explaining",
      "the result in plain language with real numbers. Always filter by the tenant/store id given in the",
      "question — never return figures across stores that aren't the one being asked about.",
    ].join(" "),
  });
}
