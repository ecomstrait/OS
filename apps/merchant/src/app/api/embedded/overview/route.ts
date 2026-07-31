import { NextResponse } from "next/server";
import { authenticateEmbedded } from "@/lib/embedded-auth";

export const runtime = "nodejs";

/**
 * GET /api/embedded/overview?shop=
 *
 * What the embedded app's home screen shows: which EcomStrait store this shop
 * is linked to, and where its listings stand. Everything here is scoped to the
 * shop the app is running on.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = await authenticateEmbedded(req, url.searchParams.get("shop"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin, storeId, shopDomain } = auth.ctx;

  const merchantUrl = process.env.NEXT_PUBLIC_MERCHANT_URL ?? "";

  if (!storeId) {
    return NextResponse.json(
      {
        linked: false,
        shopDomain,
        merchantUrl,
        // Nothing to count yet — the merchant hasn't provisioned a store here.
        counts: { approved: 0, pending: 0, declined: 0 },
        catalogSize: 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: store } = await admin
    .from("stores")
    .select("id, name, type, status, live_url, theme")
    .eq("id", storeId)
    .maybeSingle();

  const { data: listings } = await admin
    .from("store_products")
    .select("status")
    .eq("store_id", storeId);

  const counts = { approved: 0, pending: 0, declined: 0 };
  for (const l of listings ?? []) {
    if (l.status in counts) counts[l.status as keyof typeof counts] += 1;
  }

  // How much of the supplier catalog is still available to add.
  const { count: catalogSize } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  return NextResponse.json(
    {
      linked: true,
      shopDomain,
      merchantUrl,
      store: {
        id: store?.id,
        name: store?.name ?? "Your store",
        type: store?.type,
        status: store?.status,
        theme: store?.theme,
        liveUrl: store?.live_url,
      },
      counts,
      catalogSize: catalogSize ?? 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
