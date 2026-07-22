import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@ecomstrait/db/types";

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
