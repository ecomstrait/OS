import { apiError, apiOk, readJson } from "@/lib/api-response";
import { CART_LIMIT, guard } from "@/lib/rate-limit";
import {
  mutateCart,
  priceCart,
  readCart,
  resolveStore,
  writeCart,
  type PricedCart,
} from "@/lib/storefront-api";

export const runtime = "nodejs";

type CartBody = { productId?: unknown; quantity?: unknown };

function parseBody(body: CartBody | null): { productId: string; quantity: number } | null {
  if (!body || typeof body.productId !== "string" || !body.productId) return null;
  const quantity = typeof body.quantity === "number" ? Math.trunc(body.quantity) : 1;
  if (!Number.isFinite(quantity)) return null;
  return { productId: body.productId, quantity };
}

/**
 * GET — the current cart, re-priced.
 *
 * Pricing on read means a cart that went stale (product unlisted, stock sold
 * down) self-corrects, and the response says what changed via removed/adjusted.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const limited = await guard(req, "cart", storeId, CART_LIMIT);
  if (limited) return limited;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const stored = await readCart(storeId);
  const cart = await priceCart(storeId, stored);

  // Reconcile the jar if pricing dropped or clamped anything.
  if (cart.removed.length || cart.adjusted.length) {
    await writeCart(
      storeId,
      cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );
  }
  return apiOk<{ cart: PricedCart }>({ cart });
}

/** POST — add to cart (quantity defaults to 1 and is added to what's there). */
export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const limited = await guard(req, "cart", storeId, CART_LIMIT);
  if (limited) return limited;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const parsed = parseBody(await readJson<CartBody>(req));
  if (!parsed) return apiError("productId is required", 400);

  const cart = await mutateCart(storeId, { ...parsed, mode: "add" });
  const rejected = cart.removed.find((r) => r.productId === parsed.productId);
  if (rejected) {
    return apiError(
      rejected.reason === "out_of_stock" ? "That product is out of stock" : "That product isn't available",
      409,
    );
  }
  return apiOk({ cart });
}

/** PATCH — set an exact line quantity; 0 removes the line. */
export async function PATCH(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const limited = await guard(req, "cart", storeId, CART_LIMIT);
  if (limited) return limited;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const parsed = parseBody(await readJson<CartBody>(req));
  if (!parsed) return apiError("productId is required", 400);

  const cart = await mutateCart(storeId, { ...parsed, mode: "set" });
  return apiOk({ cart });
}

/** DELETE — remove one line (?productId=) or clear the whole cart. */
export async function DELETE(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const limited = await guard(req, "cart", storeId, CART_LIMIT);
  if (limited) return limited;
  if (!(await resolveStore(storeId))) return apiError("Store not found", 404);

  const productId = new URL(req.url).searchParams.get("productId");
  if (productId) {
    const cart = await mutateCart(storeId, { productId, quantity: 0, mode: "set" });
    return apiOk({ cart });
  }

  await writeCart(storeId, []);
  return apiOk({
    cart: { lines: [], subtotal: 0, itemCount: 0, currency: "usd", removed: [], adjusted: [] },
  });
}
