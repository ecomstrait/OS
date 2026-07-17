import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/notify";

type LeadBody = {
  formName?: string;
  page?: string;
  data?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const formName = (body.formName || "lead").toString().slice(0, 64);
  const data = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;
  const page = body.page ? String(body.page).slice(0, 200) : null;

  const email = String(data.email ?? "").trim().toLowerCase();
  const name = String(data.name ?? data.contact ?? data.company ?? "").trim();

  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  // 1) Persist to Supabase (write-only via RLS insert policy).
  let saved = false;
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("leads").insert({
      form_name: formName,
      name: name || null,
      email,
      page,
      payload: data,
    });
    if (error) console.error("[supabase] leads insert error:", error.message);
    else saved = true;
  }

  // 2) Email the team (best-effort).
  const emailed = await sendNotification({
    subject: `New ${formName} lead — ${name || email}`,
    heading: `New ${formName} submission`,
    data,
    meta: { Page: page ?? undefined, Form: formName },
    replyTo: email,
  });

  if (!saved && !emailed) {
    return NextResponse.json(
      { error: "We couldn't process your submission. Please try again or email us." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, saved, emailed });
}
