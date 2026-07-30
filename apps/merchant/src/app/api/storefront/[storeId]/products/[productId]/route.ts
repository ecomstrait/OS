import { apiError, apiOk } from "@/lib/api-response";
import { getStoreProduct, resolveStore } from "@/lib/storefront-api";

export const runtime = "nodejs";

/** GET /api/storefront/:storeId/products/:productId — single product detail. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> },
) {
  const { storeId, productId } = await params;
  const store = await resolveStore(storeId);
  if (!store) return apiError("Store not found", 404);

  const product = await getStoreProduct(storeId, productId);
  if (!product) return apiError("Product not found", 404);

  return apiOk({ product });
}
