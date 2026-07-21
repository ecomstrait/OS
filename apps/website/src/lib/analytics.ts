/**
 * Lightweight, vendor-free funnel tracking. Fire-and-forget from the client:
 *   - POSTs to /api/track (stored in Supabase `analytics_events`), and
 *   - mirrors to gtag / dataLayer if a tag manager is present.
 *
 * Never throws, never blocks UI. Swap the sink later (PostHog, Plausible, …)
 * without touching call sites.
 */

export type AnalyticsEvent =
  | "idea_submitted"
  | "build_clicked"
  | "waitlist_joined";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;

  // 1) First-party sink (best-effort; keepalive survives navigation).
  try {
    const payload = JSON.stringify({ name, path, props });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }

  // 2) Mirror to a tag manager if one is installed.
  try {
    window.gtag?.("event", name, props);
    window.dataLayer?.push({ event: name, ...props });
  } catch {
    /* ignore */
  }
}
