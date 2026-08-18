import { NextResponse } from "next/server";
import { sweepExpiredDrafts } from "@/lib/draft-sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled expiry of abandoned draft stores.
 *
 * Deliberately a plain authenticated endpoint rather than pg_cron: the sweep
 * has to delete objects from R2, which the database can't reach. Any scheduler
 * that can make an HTTPS call — Vercel Cron, a Supabase scheduled function,
 * GitHub Actions — can drive it. Daily is ample against a 3-day TTL.
 *
 * The builder also sweeps the current merchant on entry, so drafts still expire
 * where no scheduler is wired up at all; this is what keeps that bounded rather
 * than leaving an abandoned account's media in R2 forever.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Without a configured secret the route would be an unauthenticated delete
  // endpoint, so it stays shut rather than falling open.
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const res = await sweepExpiredDrafts();
  if (res.error) return NextResponse.json({ error: res.error }, { status: 500 });

  return NextResponse.json({ deleted: res.deleted });
}
