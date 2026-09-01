import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runReadOnlyQuery } from "../../mcp/supabase-query";

/**
 * The same read-only query guard as the Supabase MCP server
 * (`../../mcp/supabase-server.ts`), wrapped as a LangChain tool for agents
 * that call it directly (in-process, no HTTP round trip) rather than through
 * the MCP protocol.
 */
export const supabaseQueryTool = tool(
  async ({ sql, params }: { sql: string; params?: (string | number | boolean | null)[] }) => {
    const result = await runReadOnlyQuery(sql, params ?? []);
    return result.ok ? JSON.stringify(result.rows) : `Error: ${result.error}`;
  },
  {
    name: "run_sql_query",
    description:
      "Run a parameterized, read-only (SELECT/WITH) SQL query against the platform database. " +
      "Use $1, $2, ... placeholders in `sql` and pass their values in `params`, in order. " +
      "Relevant tables: stores, store_orders, store_products, products, suppliers, orders.",
    schema: z.object({
      sql: z.string(),
      params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    }),
  },
);
