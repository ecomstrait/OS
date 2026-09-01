import "server-only";

/**
 * The read-only SQL guard, factored out so it has exactly one implementation
 * shared by the Supabase MCP server tool (./supabase-server.ts) and the
 * Analytics agent's LangChain tool (../agents/tools/supabase-query-tool.ts).
 *
 * Requires `MCP_SUPABASE_READONLY_URL`: a connection string for a Postgres
 * role with SELECT-only grants AND `bypassrls` (see step 8 of
 * Docs/AI-Native-Manual-Setup.md — a plain SELECT grant alone returns zero
 * rows on any RLS-enabled table, which looks like "it works" right up until
 * an agent confidently reports a merchant has no orders).
 *
 * The regex check is defense in depth, not the security boundary — the DB
 * role is. A prompt injection that talks the model into sending a DROP TABLE
 * should fail at both layers, not rely on either one alone.
 */
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  const url = process.env.MCP_SUPABASE_READONLY_URL;
  if (!url) {
    throw new Error(
      "[ai] MCP_SUPABASE_READONLY_URL is not set — see Docs/AI-Native-Manual-Setup.md step 8.",
    );
  }
  if (!pool) pool = new Pool({ connectionString: url, max: 3 });
  return pool;
}

const READ_ONLY_PATTERN = /^\s*(select|with)\b/i;
export const DEFAULT_MAX_ROWS = 100;
export const HARD_MAX_ROWS = 200;

export type SqlParam = string | number | boolean | null;
export type ReadOnlyQueryResult = { ok: true; rows: unknown[] } | { ok: false; error: string };

export async function runReadOnlyQuery(
  sql: string,
  params: SqlParam[] = [],
  maxRows = DEFAULT_MAX_ROWS,
): Promise<ReadOnlyQueryResult> {
  if (!READ_ONLY_PATTERN.test(sql)) {
    return { ok: false, error: "Only SELECT/WITH statements are allowed." };
  }
  try {
    const result = await getPool().query(sql, params);
    return { ok: true, rows: result.rows.slice(0, Math.min(maxRows, HARD_MAX_ROWS)) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "query failed" };
  }
}
