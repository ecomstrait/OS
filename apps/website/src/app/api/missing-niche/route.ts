import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/notify";

/**
 * Captures demand for niches not yet in the beta builder: saves to the `leads`
 * table (form_name = "missing-niche") and emails the team via Resend.
 */
export async function POST(req: Request) {
  let body: { email?: string; niche?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const niche = String(body.niche ?? "").trim().slice(0, 120);

  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!niche) {
    return NextResponse.json({ error: "Missing niche." }, { status: 400 });
  }

  let saved = false;
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("leads").insert({
      form_name: "missing-niche",
      email,
      payload: { niche },
    });
    if (error) console.error("[supabase] missing-niche insert error:", error.message);
    else saved = true;
  }

  const emailed = await sendNotification({
    subject: `Niche request — ${niche}`,
    heading: "New niche requested for the builder",
    data: { email, niche },
    replyTo: email,
  });

  if (!saved && !emailed) {
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, saved, emailed });
}
