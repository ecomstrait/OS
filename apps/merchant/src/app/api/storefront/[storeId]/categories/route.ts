import { apiError, apiOk } from "@/lib/api-response";
import { listStoreCategories, resolveStore } from "@/lib/storefront-api";

export const runtime = "nodejs";

/** GET /api/storefront/:storeId/categories — every category in the store's sellable catalog. */
export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await resolveStore(storeId);
  if (!store) return apiError("Store not found", 404);

  const categories = await listStoreCategories(storeId);
  return apiOk({ categories });
}
