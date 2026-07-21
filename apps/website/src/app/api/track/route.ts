import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const ALLOWED = new Set(["idea_submitted", "build_clicked", "waitlist_joined"]);

export async function POST(req: Request) {
  let body: { name?: string; path?: string; props?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = String(body.name ?? "").slice(0, 64);
  if (!ALLOWED.has(name)) {
    // Unknown events are silently accepted-but-dropped (never a hard error).
    return NextResponse.json({ ok: true, stored: false });
  }

  const path = body.path ? String(body.path).slice(0, 200) : null;
  const props =
    body.props && typeof body.props === "object" ? body.props : {};

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("analytics_events")
      .insert({ name, path, props });
    if (error) console.error("[supabase] analytics insert error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
