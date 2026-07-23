import { NextResponse } from "next/server";
import { createAdminClient } from "@ecomstrait/db";

/**
 * The Shopify app calls this on install (afterAuth) with the shop + access
 * token, authenticated by a shared secret. We upsert it into the dev-store pool.
 */
export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_APP_SHARED_SECRET;
  const provided = req.headers.get("x-ecomstrait-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { shop?: string; accessToken?: string; scopes?: string; shopifyShopId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const shop = body.shop?.trim();
  const accessToken = body.accessToken?.trim();
  if (!shop || !accessToken) {
    return NextResponse.json({ error: "shop and accessToken required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const { error } = await admin.from("shopify_stores").upsert(
    {
      shop_domain: shop,
      access_token: accessToken,
      scopes: body.scopes ?? null,
      shopify_shop_id: body.shopifyShopId ?? null,
      status: "available",
      sync_status: "connected",
    },
    { onConflict: "shop_domain" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
