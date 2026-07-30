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

type PushProduct = {
  title: string;
  price: number | null;
  description?: string | null;
  sku?: string | null;
  /** Units the supplier has available; enables tracking and seeds the quantity. */
  inventory?: number | null;
};

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

/** Price, SKU and inventory tracking land on the auto-created default variant. */
const VARIANTS_UPDATE = `
mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id inventoryItem { id } }
    userErrors { field message }
  }
}`;

/** Seeding a quantity needs a location, which needs the read_locations scope. */
const PRIMARY_LOCATION = `{ locations(first: 1, includeInactive: false) { nodes { id } } }`;

const INVENTORY_SET = `
mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup { createdAt }
    userErrors { field message }
  }
}`;

/**
 * The shop's primary location, or null when the token predates the
 * read_locations scope. Null means we still enable tracking but can't seed a
 * quantity — better than failing the whole product push over it.
 */
export async function fetchPrimaryLocation(shop: string, token: string): Promise<string | null> {
  try {
    const res = await shopifyGraphql(shop, token)<{
      data?: { locations?: { nodes?: { id: string }[] } };
    }>(PRIMARY_LOCATION);
    return res.data?.locations?.nodes?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

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
  data?: {
    productVariantsBulkUpdate?: {
      productVariants?: { id: string; inventoryItem?: { id: string } | null }[];
      userErrors?: { message: string }[];
    };
  };
  errors?: GraphqlError[];
};
type InventoryResp = {
  data?: { inventorySetQuantities?: { userErrors?: { message: string }[] } };
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
): Promise<{ created: number; errors: string[]; ids: Map<string, string> }> {
  const gql = shopifyGraphql(shop, token);
  // One lookup for the whole batch. Null when read_locations isn't granted.
  const locationId = await fetchPrimaryLocation(shop, token);
  let created = 0;
  const errors: string[] = [];
  /** our product id (sent as the SKU) -> the Shopify product gid it became. */
  const ids = new Map<string, string>();

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
      if (p.sku) ids.set(p.sku, product.id);

      // A product with no price is still a product — record the problem but
      // don't discard the product we just created.
      const variantId = product.variants?.nodes?.[0]?.id;
      if (variantId) {
        const track = p.inventory != null;
        const vr = await gql<VariantsResp>(VARIANTS_UPDATE, {
          productId: product.id,
          variants: [
            {
              id: variantId,
              ...(p.price != null ? { price: String(p.price) } : {}),
              inventoryItem: {
                ...(p.sku ? { sku: p.sku } : {}),
                // Untracked variants show "Inventory not tracked" and always
                // read as purchasable; tracking mirrors the supplier's stock.
                ...(track ? { tracked: true } : {}),
              },
            },
          ],
        });
        const vErrs = collectErrors(vr.data?.productVariantsBulkUpdate?.userErrors, vr.errors);
        if (vErrs.length) errors.push(`${p.title} (variant): ${vErrs.join("; ")}`);

        const inventoryItemId =
          vr.data?.productVariantsBulkUpdate?.productVariants?.[0]?.inventoryItem?.id;
        if (track && locationId && inventoryItemId) {
          const iv = await gql<InventoryResp>(INVENTORY_SET, {
            input: {
              name: "available",
              reason: "correction",
              quantities: [
                {
                  inventoryItemId,
                  locationId,
                  quantity: Math.max(0, Math.trunc(p.inventory ?? 0)),
                },
              ],
            },
          });
          const iErrs = collectErrors(iv.data?.inventorySetQuantities?.userErrors, iv.errors);
          if (iErrs.length) errors.push(`${p.title} (stock): ${iErrs.join("; ")}`);
        }
      }
    } catch (e) {
      errors.push(`${p.title}: ${e instanceof Error ? e.message : "product push failed"}`);
    }
  }
  return { created, errors, ids };
}

/**
 * What's already in the shop, from one pass over its variants.
 *
 * `productIds` is the authoritative check — a listing records the Shopify
 * product it became. `skuToProductId` is the fallback for listings created
 * before that column existed, and lets sync backfill them.
 */
export async function fetchShopCatalog(
  shop: string,
  token: string,
): Promise<{ productIds: Set<string>; skuToProductId: Map<string, string> }> {
  const gql = shopifyGraphql(shop, token);
  const productIds = new Set<string>();
  const skuToProductId = new Map<string, string>();
  let cursor: string | null = null;

  // 250 is the page maximum; the loop is bounded so a pagination bug can't spin.
  for (let page = 0; page < 40; page++) {
    const res: {
      data?: {
        productVariants?: {
          nodes?: { sku: string | null; product?: { id: string } | null }[];
          pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        };
      };
    } = await gql(
      `query shopCatalog($cursor: String) {
        productVariants(first: 250, after: $cursor) {
          nodes { sku product { id } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { cursor },
    );
    const conn = res.data?.productVariants;
    for (const v of conn?.nodes ?? []) {
      if (v.product?.id) productIds.add(v.product.id);
      if (v.sku && v.product?.id) skuToProductId.set(v.sku, v.product.id);
    }
    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return { productIds, skuToProductId };
}
