/**
 * Read-only SQL, exposed over MCP.
 *
 * Generic and app-agnostic — unlike the Shopify MCP server (which lives in
 * `apps/merchant` because it wraps app-local domain logic), this one only
 * needs a Postgres connection string, so it belongs in the shared package.
 * The actual query logic lives in `./supabase-query.ts`, shared with the
 * Analytics agent's LangChain tool.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runReadOnlyQuery, DEFAULT_MAX_ROWS, HARD_MAX_ROWS } from "./supabase-query";

export function createSupabaseMcpServer(): McpServer {
  const server = new McpServer({ name: "ecomstrait-supabase", version: "0.1.0" });

  server.registerTool(
    "query",
    {
      title: "Run a read-only SQL query",
      description:
        "Run a parameterized, read-only (SELECT/WITH) SQL query against the platform database. " +
        "Any other statement is rejected before it reaches the database. Use $1, $2, ... placeholders " +
        "in `sql` and pass their values in `params`, in order.",
      inputSchema: {
        sql: z.string(),
        params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
        maxRows: z.number().int().positive().max(HARD_MAX_ROWS).optional(),
      },
    },
    async ({ sql, params, maxRows }) => {
      const result = await runReadOnlyQuery(sql, params ?? [], maxRows ?? DEFAULT_MAX_ROWS);
      if (!result.ok) return { content: [{ type: "text", text: result.error }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(result.rows) }] };
    },
  );

  return server;
}
