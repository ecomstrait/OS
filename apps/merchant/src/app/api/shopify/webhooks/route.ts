import { NextResponse } from "next/server";
import { createAdminClient } from "@ecomstrait/db";
import { verifyShopifyHmac } from "@/lib/shopify";
import { recordCustomerOrder, type SoldItem } from "@/lib/order-sink";

type ShopifyLine = { title: string; quantity: number; price: string; sku?: string };
type ShopifyOrder = {
  id: number;
  line_items: ShopifyLine[];
  customer?: { first_name?: string; last_name?: string; email?: string };
  email?: string;
  shipping_address?: Record<string, string | null>;
};

function fmtShippingAddr(a?: Record<string, string | null>): string | null {
  if (!a) return null;
  const parts = [
    a.name,
    [a.address1, a.address2].filter(Boolean).join(" "),
    [a.city, a.province, a.zip].filter(Boolean).join(" "),
    a.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_API_SECRET;
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic");
  const shop = req.headers.get("x-shopify-shop-domain");
  const raw = await req.text();

  if (!secret || !verifyShopifyHmac(raw, hmac, secret)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  // Only orders/create matters for the fulfilment loop right now. Ack the rest.
  if (topic !== "orders/create" || !shop) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  // shop → dev-store pool row → the merchant's store
  const { data: pool } = await admin.from("shopify_stores").select("id").eq("shop_domain", shop).maybeSingle();
  if (!pool) return NextResponse.json({ ok: true });
  const { data: store } = await admin.from("stores").select("id").eq("shopify_store_id", pool.id).maybeSingle();
  if (!store) return NextResponse.json({ ok: true });

  // Map Shopify line items to our products/suppliers (by title, via store_products).
  const { data: sp } = await admin.from("store_products").select("product_id").eq("store_id", store.id);
  const ids = (sp ?? []).map((r) => r.product_id);
  const { data: prods } = ids.length
    ? await admin.from("products").select("id, title, supplier_id").in("id", ids)
    : { data: [] };
  const byId = new Map((prods ?? []).map((p) => [p.id, p]));
  const byTitle = new Map((prods ?? []).map((p) => [p.title.toLowerCase().trim(), p]));

  const order = JSON.parse(raw) as ShopifyOrder;
  const items: SoldItem[] = (order.line_items ?? []).map((li) => {
    // We push products with sku = our product id, so match by SKU first.
    const match = (li.sku && byId.get(li.sku)) || byTitle.get(li.title.toLowerCase().trim());
    return {
      product_id: match?.id ?? null,
      supplier_id: match?.supplier_id ?? null,
      name: li.title,
      quantity: li.quantity,
      unit_price: li.price ? Number(li.price) : null,
    };
  });

  const name = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") || null;

  await recordCustomerOrder(admin, {
    storeId: store.id,
    externalId: `shopify:${order.id}`,
    customerName: name,
    customerEmail: order.customer?.email ?? order.email ?? null,
    shipping: fmtShippingAddr(order.shipping_address),
    items,
  });

  return NextResponse.json({ ok: true });
}
