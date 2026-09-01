import { apiError, apiOk, readJson } from "@/lib/api-response";
import { NEWSLETTER_LIMIT, guard } from "@/lib/rate-limit";
import { resolveStore } from "@/lib/storefront-api";
import { subscribeToNewsletter } from "@/lib/newsletter";

export const runtime = "nodejs";

type Body = { email?: unknown };

/** POST /api/storefront/:storeId/newsletter — add an email to this store's newsletter list. */
export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const limited = await guard(req, "newsletter", storeId, NEWSLETTER_LIMIT);
  if (limited) return limited;

  const store = await resolveStore(storeId);
  if (!store) return apiError("Store not found", 404);

  const body = await readJson<Body>(req);
  if (typeof body?.email !== "string") return apiError("Enter a valid email address.", 400);

  const result = await subscribeToNewsletter(storeId, store.name, body.email);
  if (!result.ok) return apiError(result.error ?? "That didn't go through.", 400);
  return apiOk({ ok: true });
}
