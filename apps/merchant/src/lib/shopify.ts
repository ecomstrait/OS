import crypto from "node:crypto";

export const SHOPIFY_API_VERSION = "2026-10";

/** A GraphQL Admin API caller bound to a shop + access token. */
export function shopifyGraphql(shop: string, token: string) {
  return async function <T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return res.json() as Promise<T>;
  };
}

/** Verify a Shopify webhook HMAC against the app's API secret. */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

type PushProduct = { title: string; price: number | null; description?: string | null; sku?: string | null };

const PRODUCT_CREATE = `
mutation productCreate($input: ProductInput!) {
  productCreate(input: $input) { product { id } userErrors { message } }
}`;

/**
 * Push the AI-built catalog into a Shopify store. Creates a product per item
 * (title + description + a default variant price). Returns created product ids.
 */
export async function pushProductsToShopify(
  shop: string,
  token: string,
  products: PushProduct[],
): Promise<{ created: number; errors: string[] }> {
  const gql = shopifyGraphql(shop, token);
  let created = 0;
  const errors: string[] = [];

  for (const p of products) {
    try {
      const input: Record<string, unknown> = {
        title: p.title,
        descriptionHtml: p.description ? `<p>${p.description}</p>` : undefined,
        status: "ACTIVE",
      };
      if (p.price != null) {
        input.variants = [{ price: String(p.price), sku: p.sku ?? undefined }];
      }
      const r = await gql<{ data?: { productCreate?: { userErrors?: { message: string }[] } } }>(
        PRODUCT_CREATE,
        { input },
      );
      const errs = r.data?.productCreate?.userErrors ?? [];
      if (errs.length) errors.push(errs.map((e) => e.message).join("; "));
      else created += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "product push failed");
    }
  }
  return { created, errors };
}
