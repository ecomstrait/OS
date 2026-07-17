import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/notify";

export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const source = body.source ? String(body.source).slice(0, 200) : null;

  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  let saved = false;
  const supabase = getSupabase();
  if (supabase) {
    // Ignore duplicates so re-subscribing is a friendly no-op.
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });
    if (error) console.error("[supabase] newsletter upsert error:", error.message);
    else saved = true;
  }

  const emailed = await sendNotification({
    subject: `New newsletter subscriber — ${email}`,
    heading: "New newsletter subscriber",
    data: { email, source: source ?? "—" },
    replyTo: email,
  });

  if (!saved && !emailed) {
    return NextResponse.json({ error: "Could not subscribe. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, saved, emailed });
}
