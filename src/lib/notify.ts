import { Resend } from "resend";
import { siteConfig } from "@/lib/site";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send a notification email via Resend. Tolerant by design: if the API key is
 * missing or Resend rejects (e.g. unverified domain), it returns false instead
 * of throwing, so form submissions still succeed once saved to Supabase.
 *
 * Optional env: RESEND_FROM (default onboarding@resend.dev), LEAD_NOTIFY_EMAIL
 * (default siteConfig.email) — set LEAD_NOTIFY_EMAIL to your inbox to receive
 * leads before verifying a sending domain in Resend.
 */
export async function sendNotification(opts: {
  subject: string;
  heading: string;
  data: Record<string, unknown>;
  meta?: Record<string, string | undefined>;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM || `${siteConfig.name} <onboarding@resend.dev>`;
  const to = process.env.LEAD_NOTIFY_EMAIL || siteConfig.email;
  const cc = (process.env.LEAD_NOTIFY_CC || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const rows = Object.entries(opts.data)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#64748b;vertical-align:top;text-transform:capitalize">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0f172a;font-weight:600">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const metaLine = opts.meta
    ? Object.entries(opts.meta)
        .filter(([, v]) => v)
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`)
        .join(" · ")
    : "";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      ...(cc.length ? { cc } : {}),
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px">
          <h2 style="margin:0 0 16px;color:#0f172a">${escapeHtml(opts.heading)}</h2>
          <table style="border-collapse:collapse;font-size:14px">${rows}</table>
          ${metaLine ? `<p style="margin-top:16px;color:#94a3b8;font-size:12px">${metaLine}</p>` : ""}
        </div>`,
    });
    if (error) {
      console.error("[resend] send error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[resend] threw:", err);
    return false;
  }
}
