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
  /** Public image URLs. Shopify fetches these itself, asynchronously. */
  images?: string[];
};

/** Shopify caps product media; more than this is noise on a storefront anyway. */
const MAX_MEDIA = 10;

function mediaInput(p: PushProduct) {
  return (p.images ?? []).slice(0, MAX_MEDIA).map((url) => ({
    originalSource: url,
    mediaContentType: "IMAGE",
    alt: p.title,
  }));
}

/**
 * `productCreate` no longer accepts variants inline — `ProductInput.variants`
 * was removed, and the argument is now `product: ProductCreateInput!`. The old
 * call failed at the GraphQL layer, which put the message in the top-level
 * `errors` array rather than `userErrors`; because the code only inspected
 * `userErrors` it counted every failure as a success and reported "pushed N
 * products" into a shop that received none.
 */
const PRODUCT_CREATE = `
mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) {
    product { id variants(first: 1) { nodes { id } } }
    userErrors { field message }
  }
}`;

/** Attach images to a product that already exists (backfill path). */
const PRODUCT_CREATE_MEDIA = `
mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    mediaUserErrors { field message }
  }
}`;

type MediaResp = {
  data?: { productCreateMedia?: { mediaUserErrors?: { message: string }[] } };
  errors?: { message: string }[];
};

/**
 * Add images to products that were pushed before media was wired up.
 *
 * Without this the only fix would be deleting every product and re-syncing.
 */
export async function backfillProductMedia(
  shop: string,
  token: string,
  items: { productId: string; title: string; images: string[] }[],
): Promise<{ updated: number; errors: string[] }> {
  const gql = shopifyGraphql(shop, token);
  let updated = 0;
  const errors: string[] = [];
  for (const it of items) {
    const media = mediaInput({ title: it.title, price: null, images: it.images });
    if (!media.length) continue;
    try {
      const res = await gql<MediaResp>(PRODUCT_CREATE_MEDIA, { productId: it.productId, media });
      const errs = collectErrors(res.data?.productCreateMedia?.mediaUserErrors, res.errors);
      if (errs.length) errors.push(`${it.title}: ${errs.join("; ")}`);
      else updated += 1;
    } catch (e) {
      errors.push(`${it.title}: ${e instanceof Error ? e.message : "media push failed"}`);
    }
  }
  return { updated, errors };
}

/** Price, SKU and inventory tracking land on the auto-created default variant. */
const VARIANTS_UPDATE = `
mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id inventoryItem { id } }
    userErrors { field message }
  }
}`;

const PUBLICATIONS = `{ publications(first: 25) { nodes { id name } } }`;

const PUBLISHABLE_PUBLISH = `
mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    userErrors { field message }
  }
}`;

/**
 * The Online Store publication id, or null when read_publications isn't granted.
 *
 * A product created through the API is NOT on any sales channel by default —
 * `publishedAt` stays null and the storefront never shows it, even though it
 * looks fine in admin. Publishing to this channel is what makes it visible.
 */
export async function fetchOnlineStorePublicationId(
  shop: string,
  token: string,
): Promise<string | null> {
  try {
    const res = await shopifyGraphql(shop, token)<{
      data?: { publications?: { nodes?: { id: string; name: string }[] } };
    }>(PUBLICATIONS);
    const nodes = res.data?.publications?.nodes ?? [];
    return nodes.find((n) => /online store/i.test(n.name))?.id ?? null;
  } catch {
    return null;
  }
}

/** Seeding a quantity needs a location, which needs the read_locations scope. */
const PRIMARY_LOCATION = `{ locations(first: 1, includeInactive: false) { nodes { id } } }`;

/**
 * Shopify requires a field-level `@idempotent` directive on this mutation (it
 * rejects the call outright without one), and the key has to be unique per
 * call — so the document is built per invocation rather than being a constant.
 * The directive is only valid on the field, not the operation.
 */
const inventorySetDoc = () => `
mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) @idempotent(key: "${crypto.randomUUID()}") {
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
type PublishResp = {
  data?: { publishablePublish?: { userErrors?: { message: string }[] } };
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
  let created = 0;
  const errors: string[] = [];
  /** our product id (sent as the SKU) -> the Shopify product gid it became. */
  const ids = new Map<string, string>();

  // One lookup each for the whole batch. Null when the scope isn't granted.
  const locationId = await fetchPrimaryLocation(shop, token);
  const publicationId = await fetchOnlineStorePublicationId(shop, token);
  if (!publicationId) {
    errors.push(
      "Created, but not published to the Online Store — the app needs the read_publications/write_publications scopes (reinstall it). Products stay hidden from the storefront until then.",
    );
  }

  for (const p of products) {
    try {
      const res = await gql<ProductCreateResp>(PRODUCT_CREATE, {
        product: {
          title: p.title,
          descriptionHtml: p.description ? `<p>${p.description}</p>` : undefined,
          status: "ACTIVE",
        },
        media: mediaInput(p),
      });

      const createErrs = collectErrors(res.data?.productCreate?.userErrors, res.errors);
      const product = res.data?.productCreate?.product;
      if (!product?.id) {
        errors.push(`${p.title}: ${createErrs.join("; ") || "productCreate returned no product"}`);
        continue;
      }
      created += 1;
      if (p.sku) ids.set(p.sku, product.id);

      // Without this the product exists in admin but never reaches the storefront.
      if (publicationId) {
        const pub = await gql<PublishResp>(PUBLISHABLE_PUBLISH, {
          id: product.id,
          input: [{ publicationId }],
        });
        const pErrs = collectErrors(pub.data?.publishablePublish?.userErrors, pub.errors);
        if (pErrs.length) errors.push(`${p.title} (publish): ${pErrs.join("; ")}`);
      }

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
          const iv = await gql<InventoryResp>(inventorySetDoc(), {
            input: {
              name: "available",
              reason: "correction",
              quantities: [
                {
                  inventoryItemId,
                  locationId,
                  quantity: Math.max(0, Math.trunc(p.inventory ?? 0)),
                  // Optimistic-concurrency baseline. Schema marks it optional
                  // but Shopify rejects `available` without it. This runs
                  // immediately after productCreate, so the current value is 0.
                  changeFromQuantity: 0,
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
): Promise<{
  productIds: Set<string>;
  skuToProductId: Map<string, string>;
  /** Products in the shop with no images yet. */
  withoutMedia: Set<string>;
}> {
  const gql = shopifyGraphql(shop, token);
  const productIds = new Set<string>();
  const skuToProductId = new Map<string, string>();
  const withoutMedia = new Set<string>();
  let cursor: string | null = null;

  // 250 is the page maximum; the loop is bounded so a pagination bug can't spin.
  for (let page = 0; page < 40; page++) {
    const res: {
      data?: {
        products?: {
          nodes?: {
            id: string;
            mediaCount?: { count: number } | null;
            variants?: { nodes?: { sku: string | null }[] };
          }[];
          pageInfo?: { hasNextPage: boolean; endCursor: string | null };
        };
      };
    } = await gql(
      `query shopCatalog($cursor: String) {
        products(first: 100, after: $cursor) {
          nodes {
            id
            mediaCount { count }
            variants(first: 5) { nodes { sku } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { cursor },
    );
    const conn = res.data?.products;
    for (const p of conn?.nodes ?? []) {
      productIds.add(p.id);
      if ((p.mediaCount?.count ?? 0) === 0) withoutMedia.add(p.id);
      for (const v of p.variants?.nodes ?? []) if (v.sku) skuToProductId.set(v.sku, p.id);
    }
    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return { productIds, skuToProductId, withoutMedia };
}

const DEFAULT_PROFILE = `
{
  deliveryProfiles(first: 5) {
    nodes {
      id
      default
      profileLocationGroups {
        locationGroup { id }
        locationGroupZones(first: 10) {
          nodes {
            zone { id name }
            methodDefinitions(first: 5) { nodes { id name active } }
          }
        }
      }
    }
  }
}`;

const DELIVERY_PROFILE_UPDATE = `
mutation deliveryProfileUpdate($id: ID!, $profile: DeliveryProfileInput!) {
  deliveryProfileUpdate(id: $id, profile: $profile) {
    profile { id }
    userErrors { field message }
  }
}`;

export type ShippingState = {
  /** Null when the read_shipping scope isn't granted. */
  hasRate: boolean | null;
  detail: string;
};

/** Does the store have any active shipping rate a customer could pick? */
export async function fetchShippingState(shop: string, token: string): Promise<ShippingState> {
  try {
    const res = await shopifyGraphql(shop, token)<{
      data?: {
        deliveryProfiles?: {
          nodes?: {
            default: boolean;
            profileLocationGroups?: {
              locationGroupZones?: {
                nodes?: { methodDefinitions?: { nodes?: { active: boolean }[] } }[];
              };
            }[];
          }[];
        };
      };
      errors?: { message: string }[];
    }>(DEFAULT_PROFILE);

    if (res.errors?.length) return { hasRate: null, detail: res.errors[0].message };

    const rates = (res.data?.deliveryProfiles?.nodes ?? []).flatMap((p) =>
      (p.profileLocationGroups ?? []).flatMap((g) =>
        (g.locationGroupZones?.nodes ?? []).flatMap((z) =>
          (z.methodDefinitions?.nodes ?? []).filter((m) => m.active),
        ),
      ),
    );
    return {
      hasRate: rates.length > 0,
      detail: rates.length
        ? `${rates.length} active rate${rates.length === 1 ? "" : "s"}`
        : "No shipping rate — checkout will block",
    };
  } catch (e) {
    return { hasRate: null, detail: e instanceof Error ? e.message : "couldn't read shipping" };
  }
}

/**
 * Give a new store a usable shipping rate.
 *
 * A store with products but no rate takes the customer all the way to checkout
 * and then refuses to complete, so provisioning seeds one. No-ops when a rate
 * already exists — we never overwrite what a merchant set up themselves.
 */
export async function ensureDefaultShippingRate(
  shop: string,
  token: string,
  opts: { amount?: number; countryCodes?: string[] } = {},
): Promise<{ created: boolean; note: string }> {
  const gql = shopifyGraphql(shop, token);

  const state = await fetchShippingState(shop, token);
  if (state.hasRate === null) return { created: false, note: `shipping not checked (${state.detail})` };
  if (state.hasRate) return { created: false, note: "shipping rate already set" };

  const res = await gql<{
    data?: {
      deliveryProfiles?: {
        nodes?: { id: string; default: boolean; profileLocationGroups?: { locationGroup: { id: string } }[] }[];
      };
    };
  }>(DEFAULT_PROFILE);
  const profile =
    res.data?.deliveryProfiles?.nodes?.find((p) => p.default) ?? res.data?.deliveryProfiles?.nodes?.[0];
  const groupId = profile?.profileLocationGroups?.[0]?.locationGroup?.id;
  if (!profile || !groupId) return { created: false, note: "no delivery profile to update" };

  const update = await gql<{
    data?: { deliveryProfileUpdate?: { userErrors?: { message: string }[] } };
    errors?: { message: string }[];
  }>(DELIVERY_PROFILE_UPDATE, {
    id: profile.id,
    profile: {
      locationGroupsToUpdate: [
        {
          id: groupId,
          zonesToCreate: [
            {
              name: "Standard shipping",
              countries: opts.countryCodes?.length
                ? opts.countryCodes.map((code) => ({ code }))
                : [{ restOfWorld: true }],
              methodDefinitionsToCreate: [
                {
                  name: "Standard",
                  active: true,
                  rateDefinition: {
                    price: { amount: String(opts.amount ?? 5), currencyCode: "USD" },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const errs = collectErrors(update.data?.deliveryProfileUpdate?.userErrors, update.errors);
  if (errs.length) return { created: false, note: `shipping rate failed: ${errs.join("; ")}` };
  return { created: true, note: "added a standard shipping rate" };
}
