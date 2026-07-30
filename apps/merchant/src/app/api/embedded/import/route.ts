import { NextResponse } from "next/server";
import { authenticateEmbedded } from "@/lib/embedded-auth";
import { pushProductsToShopify } from "@/lib/shopify";

export const runtime = "nodejs";

/**
 * POST /api/embedded/import  { shop, productId }
 *
 * Add a supplier product to the store behind this shop. Goes through the same
 * approval model as the merchant portal: the listing starts pending, and only
 * an already-approved listing is pushed into Shopify.
 */
export async function POST(req: Request) {
  let body: { shop?: string; productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const auth = await authenticateEmbedded(req, body.shop);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin, storeId, shopifyStoreId } = auth.ctx;

  if (!storeId) {
    return NextResponse.json(
      { error: "No EcomStrait store is linked to this shop yet. Provision it from your dashboard first." },
      { status: 409 },
    );
  }
  const productId = body.productId?.trim();
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const { data: product } = await admin
    .from("products")
    .select("id, title, description, retail_price, supplier_id, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.status !== "published") {
    return NextResponse.json({ error: "That product isn't published" }, { status: 409 });
  }

  const { data: existing } = await admin
    .from("store_products")
    .select("status")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ alreadyListed: true, status: existing.status });
  }

  // The decision trigger forces 'pending' for anyone who isn't the supplier, so
  // the status we get back is authoritative rather than what we asked for.
  const { data: inserted, error } = await admin
    .from("store_products")
    .insert({
      store_id: storeId,
      product_id: productId,
      supplier_id: product.supplier_id,
      price: product.retail_price,
      status: "pending",
    })
    .select("status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Approved straight away (e.g. the supplier auto-approves) → push it now so
  // the merchant sees it in Shopify without a second step.
  let pushed = false;
  if (inserted?.status === "approved") {
    const { data: shop } = await admin
      .from("shopify_stores")
      .select("shop_domain, access_token")
      .eq("id", shopifyStoreId)
      .maybeSingle();
    if (shop?.access_token) {
      try {
        const res = await pushProductsToShopify(shop.shop_domain, shop.access_token, [
          {
            title: product.title,
            description: product.description ?? null,
            price: product.retail_price,
            sku: product.id,
          },
        ]);
        pushed = res.created > 0;
      } catch {
        // The listing is recorded either way; provisioning will pick it up.
      }
    }
  }

  return NextResponse.json({ status: inserted?.status ?? "pending", pushed });
}
