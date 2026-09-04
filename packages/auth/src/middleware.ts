import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@ecomstrait/db/types";

/**
 * Set on `/auth/confirm` the moment a password-recovery link establishes a
 * session, and cleared only once `updateUser({ password })` actually
 * succeeds (see each app's reset-password-form.tsx + the
 * clearPasswordResetPending action in its lib/actions.ts).
 *
 * A recovery link logs the visitor in for real (a normal, full Supabase
 * session) before they've set anything — Supabase itself doesn't distinguish
 * that session from an ordinary login. Without this cookie, a visitor who
 * hits a validation error on /reset-password (or just closes the form) is
 * still fully authenticated and can reach the rest of the app by navigating
 * anywhere else, having never actually completed the reset. This cookie is
 * what the guard below checks to force them back to /reset-password until
 * that's actually done — real account access, not just the reset page,
 * bypassing the login flow's usual gate. httpOnly so it can't be cleared or
 * spoofed from client JS.
 */
export const PW_RESET_PENDING_COOKIE = "es-pw-reset-pending";

/** A group of protected prefixes that share a login destination. */
export type Guard = {
  prefixes: string[];
  loginPath: string;
  /** Exact paths under the prefixes that stay public (e.g. the login page). */
  allow?: string[];
};

type Options = {
  /** One or more guard groups, each with its own loginPath. */
  guards?: Guard[];
  /** Back-compat shorthand for a single guard group. */
  protectedPrefixes?: string[];
  loginPath?: string;
};

function matches(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Refreshes the Supabase session on every request and guards protected routes.
 * Supports multiple guard groups so different areas (supplier vs admin) can
 * redirect to different login pages. Call from the app's `proxy.ts`.
 */
export async function updateSession(
  request: NextRequest,
  { guards, protectedPrefixes, loginPath = "/login" }: Options = {},
) {
  const rules: Guard[] =
    guards ??
    (protectedPrefixes ? [{ prefixes: protectedPrefixes, loginPath }] : []);

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token — do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A password-recovery session is otherwise indistinguishable from a normal
  // login (see PW_RESET_PENDING_COOKIE above) — this is what actually closes
  // that gap, ahead of every per-app guard rule below: authenticated, but
  // still owes a completed password reset, gets sent back to /reset-password
  // no matter which URL they try next. Excludes only that page itself (and
  // the auth callback routes, so the redirect that lands them on it in the
  // first place isn't itself intercepted) — everything else in the app,
  // guarded prefix or not, is off-limits until the cookie clears.
  if (user && request.cookies.get(PW_RESET_PENDING_COOKIE)) {
    const path = request.nextUrl.pathname;
    if (path !== "/reset-password" && !path.startsWith("/auth/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/reset-password";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (!user) {
    const path = request.nextUrl.pathname;
    for (const rule of rules) {
      const isPublic = rule.allow?.some((a) => matches(path, a));
      if (isPublic) continue;
      if (rule.prefixes.some((p) => matches(path, p))) {
        const url = request.nextUrl.clone();
        url.pathname = rule.loginPath;
        url.searchParams.set("redirect", path);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
