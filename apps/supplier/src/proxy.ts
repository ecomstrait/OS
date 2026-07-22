import { type NextRequest } from "next/server";
import { updateSession } from "@ecomstrait/auth/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request, {
    guards: [
      {
        prefixes: ["/dashboard", "/onboarding", "/catalog", "/inventory", "/requests", "/orders", "/analytics", "/settings", "/help"],
        loginPath: "/login",
      },
      {
        prefixes: ["/admin"],
        loginPath: "/admin/login",
        allow: ["/admin/login"],
      },
    ],
  });
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image files. The auth callback
     * is allowed through (it sets the session cookie itself).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
