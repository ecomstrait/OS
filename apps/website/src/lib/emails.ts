/**
 * Branded HTML for the Founders Waitlist drip emails. Inline styles only
 * (email clients strip <style>/external CSS). Dark-navy header, emerald accent —
 * matches the EcomStrait brand tokens.
 */

import { siteConfig } from "@/lib/site";
import type { WaitlistEmail } from "@/content/waitlist-emails";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INK = "#0f172a";
const INK_SOFT = "#475569";
const BRAND = "#10b981";
const BORDER = "#e2e8f0";

export function renderWaitlistEmail(
  email: WaitlistEmail,
  ctx: { niche?: string | null } = {},
): string {
  const greeting = ctx.niche
    ? `${esc(email.heading)}`
    : esc(email.heading);

  const bodyHtml = email.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${INK_SOFT}">${esc(p)}</p>`,
    )
    .join("");

  const bulletsHtml = email.bullets?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">${email.bullets
        .map(
          (b) =>
            `<tr><td style="padding:5px 10px 5px 0;vertical-align:top;color:${BRAND};font-weight:700">•</td><td style="padding:5px 0;font-size:14px;line-height:1.55;color:${INK}">${esc(b)}</td></tr>`,
        )
        .join("")}</table>`
    : "";

  const nicheLine = ctx.niche
    ? `<p style="margin:0 0 20px;font-size:13px;color:${INK_SOFT}">Building around: <strong style="color:${INK}">${esc(ctx.niche)}</strong></p>`
    : "";

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(email.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER}">
    <tr><td style="background:${INK};padding:22px 28px">
      <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">${esc(siteConfig.name)}</span>
      <span style="font-size:12px;color:#93c5fd;margin-left:8px">Founders Waitlist</span>
    </td></tr>
    <tr><td style="padding:32px 28px 8px">
      <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${INK};font-weight:800;letter-spacing:-0.02em">${greeting}</h1>
      ${nicheLine}
      ${bodyHtml}
      ${bulletsHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">
        <tr><td style="border-radius:10px;background:${BRAND}">
          <a href="${esc(email.cta.href)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">${esc(email.cta.label)} →</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 28px 28px">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;border-top:1px solid ${BORDER};padding-top:16px">
        Simulated preview — example figures, not live data. EcomAI is rolling out in beta.<br>
        You're receiving this because you joined the ${esc(siteConfig.name)} Founders Waitlist.
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
