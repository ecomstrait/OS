import { apiError, apiOk } from "@/lib/api-response";
import { resolveStore, writeCart } from "@/lib/storefront-api";
import { confirmOrder, getOrderBySession } from "@/lib/storefront-orders";

export const runtime = "nodejs";

/**
 * GET  — read an order that's already recorded.
 * POST — confirm a Stripe session and record it (idempotent), then clear the
 *        cart. This is what a theme calls on its thank-you page.
 *
 * The Stripe session id is the capability here: it's unguessable and only the
 * buyer who completed checkout has it, so no customer login is required.
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; sessionId: string }> },
) {
  const { storeId, sessionId } = await params;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const order = await getOrderBySession(storeId, sessionId);
  if (!order) return apiError("Order not found", 404);
  return apiOk({ order });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; sessionId: string }> },
) {
  const { storeId, sessionId } = await params;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const order = await confirmOrder(storeId, sessionId);
  if (!order) return apiError("That checkout isn't complete", 409);

  // The purchase succeeded — the cart it came from is done.
  await writeCart(storeId, []);
  return apiOk({ order });
}
