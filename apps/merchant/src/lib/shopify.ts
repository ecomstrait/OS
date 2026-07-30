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

/**
 * `productCreate` no longer accepts variants inline — `ProductInput.variants`
 * was removed, and the argument is now `product: ProductCreateInput!`. The old
 * call failed at the GraphQL layer, which put the message in the top-level
 * `errors` array rather than `userErrors`; because the code only inspected
 * `userErrors` it counted every failure as a success and reported "pushed N
 * products" into a shop that received none.
 */
const PRODUCT_CREATE = `
mutation productCreate($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product { id variants(first: 1) { nodes { id } } }
    userErrors { field message }
  }
}`;

/** Price and SKU land on the auto-created default variant. */
const VARIANTS_UPDATE = `
mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id }
    userErrors { field message }
  }
}`;

type GraphqlError = { message: string };
type ProductCreateResp = {
  data?: {
    productCreate?: {
      product?: { id: string; variants?: { nodes?: { id: string }[] } } | null;
      userErrors?: { message: string }[];
    };
  };
  errors?: GraphqlError[];
};
type VariantsResp = {
  data?: { productVariantsBulkUpdate?: { userErrors?: { message: string }[] } };
  errors?: GraphqlError[];
};

/** Collect both userErrors and top-level GraphQL errors — either can be fatal. */
function collectErrors(
  userErrors: { message: string }[] | undefined,
  topLevel: GraphqlError[] | undefined,
): string[] {
  return [...(userErrors ?? []).map((e) => e.message), ...(topLevel ?? []).map((e) => e.message)];
}

/**
 * Push the AI-built catalog into a Shopify store: one product each, then the
 * price/SKU onto its default variant. `created` counts products Shopify
 * confirmed, never attempts.
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
      const res = await gql<ProductCreateResp>(PRODUCT_CREATE, {
        product: {
          title: p.title,
          descriptionHtml: p.description ? `<p>${p.description}</p>` : undefined,
          status: "ACTIVE",
        },
      });

      const createErrs = collectErrors(res.data?.productCreate?.userErrors, res.errors);
      const product = res.data?.productCreate?.product;
      if (!product?.id) {
        errors.push(`${p.title}: ${createErrs.join("; ") || "productCreate returned no product"}`);
        continue;
      }
      created += 1;

      // A product with no price is still a product — record the problem but
      // don't discard the product we just created.
      const variantId = product.variants?.nodes?.[0]?.id;
      if (variantId && (p.price != null || p.sku)) {
        const vr = await gql<VariantsResp>(VARIANTS_UPDATE, {
          productId: product.id,
          variants: [
            {
              id: variantId,
              ...(p.price != null ? { price: String(p.price) } : {}),
              ...(p.sku ? { inventoryItem: { sku: p.sku } } : {}),
            },
          ],
        });
        const vErrs = collectErrors(vr.data?.productVariantsBulkUpdate?.userErrors, vr.errors);
        if (vErrs.length) errors.push(`${p.title} (price): ${vErrs.join("; ")}`);
      }
    } catch (e) {
      errors.push(`${p.title}: ${e instanceof Error ? e.message : "product push failed"}`);
    }
  }
  return { created, errors };
}

/**
 * SKUs already present in the shop.
 *
 * We write our product id into the variant SKU on push, so this is what makes
 * syncing idempotent — without it, re-running a sync duplicates every product.
 */
export async function fetchExistingSkus(shop: string, token: string): Promise<Set<string>> {
  const gql = shopifyGraphql(shop, token);
  const skus = new Set<string>();
  let cursor: string | null = null;

  // 250 is the page maximum; the loop is bounded so a pagination bug can't spin.
  for (let page = 0; page < 40; page++) {
    const res: {
      data?: {
        productVariants?: {
          nodes?: { sku: string | null }[];
          pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        };
      };
    } = await gql(
      `query variantSkus($cursor: String) {
        productVariants(first: 250, after: $cursor) {
          nodes { sku }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { cursor },
    );
    const conn = res.data?.productVariants;
    for (const v of conn?.nodes ?? []) if (v.sku) skus.add(v.sku);
    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return skus;
}
