import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@ecomstrait/auth/middleware";

/**
 * Is this Host one of ours (the dashboard's real domain, a Vercel preview,
 * or local dev) — as opposed to a merchant's own connected domain, which
 * Vercel routes to this same deployment once it's attached to the project?
 */
function isOwnHost(host: string): boolean {
  const bare = host.split(":")[0].toLowerCase();
  if (bare === "localhost" || bare === "127.0.0.1") return true;
  if (bare.endsWith(".vercel.app")) return true;
  try {
    const configured = process.env.NEXT_PUBLIC_MERCHANT_URL;
    if (configured && new URL(configured).hostname.toLowerCase() === bare) return true;
  } catch {
    /* malformed env value — fall through to "not ours" */
  }
  return false;
}

/** The only paths a customer-facing custom domain ever needs to serve. */
function isStorefrontPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host && !isOwnHost(host) && isStorefrontPath(request.nextUrl.pathname)) {
    // A visitor on a merchant's connected domain — invisibly serve that
    // store instead of this app's own routes, which mean nothing there.
    // Everything else (the API, static assets, the dashboard itself) is
    // host-agnostic already and needs no rewrite — see storefront-pages.tsx.
    const url = request.nextUrl.clone();
    url.pathname = `/store/by-domain/${encodeURIComponent(host.split(":")[0])}${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  return updateSession(request, {
    protectedPrefixes: [
      "/dashboard",
      "/find-suppliers",
      "/gallery",
      "/builder",
      "/inventory",
      "/stores",
      "/orders",
      "/sales",
      "/billing",
      "/settings",
    ],
    loginPath: "/login",
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
