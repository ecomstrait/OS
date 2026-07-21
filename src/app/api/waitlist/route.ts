import { NextResponse } from "next/server";
import { joinWaitlist, type WaitlistInput } from "@/lib/waitlist";

export async function POST(req: Request) {
  let body: Partial<WaitlistInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const input: WaitlistInput = {
    email,
    idea: body.idea ? String(body.idea).slice(0, 120) : undefined,
    niche: body.niche ? String(body.niche).slice(0, 80) : undefined,
    persona: body.persona ? String(body.persona).slice(0, 40) : undefined,
    source: body.source ? String(body.source).slice(0, 200) : undefined,
  };

  const result = await joinWaitlist(input);

  // Persisted OR emailed = success. Only hard-fail when nothing worked at all.
  if (!result.saved && !result.emailed) {
    return NextResponse.json(
      { error: "Could not join the waitlist. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
