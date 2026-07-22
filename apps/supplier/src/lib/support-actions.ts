"use server";

import { createClient } from "@ecomstrait/auth/server";
import { escapeHtml } from "@/lib/notify";

/** Submit a support ticket — emails the team (best-effort). */
export async function submitSupportTicket(input: {
  subject: string;
  message: string;
}): Promise<{ error?: string; ok?: boolean }> {
  if (!input.message.trim()) return { error: "Please describe your issue." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL || process.env.SUPPORT_EMAIL;
  if (!key || !to) {
    // No email configured — accept so the UX isn't blocked in dev.
    return { ok: true };
  }

  const from = process.env.RESEND_FROM || "EcomStrait <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: user?.email,
        subject: `Supplier support: ${input.subject.trim() || "(no subject)"}`,
        html: `<p><strong>From:</strong> ${escapeHtml(user?.email ?? "unknown")}</p><p>${escapeHtml(input.message)}</p>`,
      }),
    });
  } catch {
    /* best-effort */
  }
  return { ok: true };
}
