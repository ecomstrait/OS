import { type NextRequest } from "next/server";
import { updateSession } from "@ecomstrait/auth/middleware";

export async function proxy(request: NextRequest) {
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
