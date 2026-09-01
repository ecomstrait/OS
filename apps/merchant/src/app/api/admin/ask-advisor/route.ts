import { NextResponse } from "next/server";
import { askBusinessAdvisor } from "@/lib/agents/business-advisor";

// Measured 8-90s in testing — see the same note on the edit page's
// maxDuration in app/(app)/stores/[id]/edit/page.tsx.
export const maxDuration = 120;

/**
 * Manual verification endpoint for the Phase 4 orchestrator
 * (Docs/AI-Native-Migration-Plan.md acceptance check) — drives the same
 * `askBusinessAdvisor` path `editStore`'s question branch calls, without
 * needing the full builder UI. Same shared-secret gate as the other
 * /api/admin/* routes.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("x-admin-secret");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tenantId, storeId, message } = (await req.json().catch(() => ({}))) as {
    tenantId?: string;
    storeId?: string;
    message?: string;
  };
  if (!tenantId || !storeId || !message) {
    return NextResponse.json({ error: "expected { tenantId, storeId, message }" }, { status: 400 });
  }

  try {
    const result = await askBusinessAdvisor({ tenantId, storeId, message });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[ask-advisor]", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
