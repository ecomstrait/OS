import { NextResponse } from "next/server";
import { retrieve } from "@ecomstrait/ai";

/**
 * Manual verification endpoint for the RAG foundation (Phase 2 acceptance
 * check in Docs/AI-Native-Migration-Plan.md) — not used by any product
 * surface yet. Same shared-secret gate as /api/admin/seed-niche-kb.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("x-admin-secret");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "expected { query: string }" }, { status: 400 });
  }

  try {
    const matches = await retrieve(query, { sourceType: "niche_kb", matchCount: 3 });
    return NextResponse.json({ ok: true, matches });
  } catch (err) {
    console.error("[search-niche-kb]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
