import { NextResponse } from "next/server";
import { apiError, apiOk, readJson } from "@/lib/api-response";
import { NEWSLETTER_LIMIT, guard } from "@/lib/rate-limit";
import { resolveStoreForNewsletter } from "@/lib/storefront-api";
import { subscribeToNewsletter } from "@/lib/newsletter";

export const runtime = "nodejs";

type Body = { email?: unknown };

/**
 * Cross-origin on purpose: a `own_platform` store calls this from its own
 * origin (same-site, no CORS needed), but a Shopify-theme store's newsletter
 * form runs on `*.myshopify.com` or the merchant's own domain — neither of
 * which is this app's origin. The endpoint only ever accepts an email and is
 * already rate-limited, so allowing any origin is the same trust level as
 * any other public signup form.
 */
function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/** POST /api/storefront/:storeId/newsletter — add an email to this store's newsletter list. */
export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const limited = await guard(req, "newsletter", storeId, NEWSLETTER_LIMIT);
  if (limited) return withCors(limited);

  const store = await resolveStoreForNewsletter(storeId);
  if (!store) return withCors(apiError("Store not found", 404));

  const body = await readJson<Body>(req);
  if (typeof body?.email !== "string") return withCors(apiError("Enter a valid email address.", 400));

  const result = await subscribeToNewsletter(storeId, store.name, body.email);
  if (!result.ok) return withCors(apiError(result.error ?? "That didn't go through.", 400));
  return withCors(apiOk({ ok: true }));
}
