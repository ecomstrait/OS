/**
 * This app's public origin, for links Supabase puts in emails.
 *
 * `window.location.origin` is right on the real site but wrong everywhere else
 * a build can run — a Vercel preview deployment sends confirmation links back
 * to the preview, and local development sends them to localhost. Prefer the
 * configured canonical URL so a confirmation email always points at the site
 * we actually want people landing on.
 *
 * Note the origin is only ever a *request*: Supabase falls back to the
 * project's Site URL unless the value is in its redirect allowlist.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MERCHANT_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3002";
}

/** Where Supabase should send someone after they confirm their email. */
export function authCallbackUrl(): string {
  return `${siteUrl()}/auth/callback`;
}
