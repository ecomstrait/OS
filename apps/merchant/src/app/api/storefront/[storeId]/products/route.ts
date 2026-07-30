import { apiError, apiOk } from "@/lib/api-response";
import { listStoreProducts, resolveStore } from "@/lib/storefront-api";

export const runtime = "nodejs";

/**
 * GET /api/storefront/:storeId/products?q=&page=&limit=
 *
 * Public product listing for a custom-website store. Supplier-approved and
 * published only.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const store = await resolveStore(storeId);
  if (!store) return apiError("Store not found", 404);

  const url = new URL(req.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "24", 10);

  const result = await listStoreProducts(storeId, {
    q: url.searchParams.get("q") ?? "",
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 24,
  });

  return apiOk({
    store: { id: store.id, name: store.name, currency: store.currency },
    ...result,
  });
}
