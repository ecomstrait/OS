import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import { merchantBaseUrl } from "../merchant-url.server";

/**
 * Discover products — the in-Shopify catalog browser.
 *
 * The merchant has no EcomStrait session inside Shopify admin, so this loader
 * authenticates the Shopify session, then calls the EcomStrait API server-side
 * with the shared secret. The shop domain is what identifies the store; the
 * secret never reaches the browser.
 */

type Product = {
  id: string;
  title: string;
  category: string | null;
  image: string | null;
  price: number | null;
  margin: number | null;
  supplierName: string;
  supplierId: string;
  available: number;
  listingStatus: "pending" | "approved" | "declined" | null;
};

type CatalogResponse = {
  linked: boolean;
  page: number;
  pageSize: number;
  total: number;
  facets?: { categories: string[]; suppliers: { id: string; name: string }[] };
  products: Product[];
  error?: string;
};

function platform() {
  return {
    base: merchantBaseUrl(),
    secret: process.env.ECOMSTRAIT_SHARED_SECRET,
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { base, secret } = platform();
  const url = new URL(request.url);

  const params = new URLSearchParams({
    shop: session.shop,
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "",
    supplier: url.searchParams.get("supplier") ?? "",
    page: url.searchParams.get("page") ?? "1",
  });

  if (!base || !secret) {
    return {
      shop: session.shop,
      data: null,
      configError: "This app isn't configured to reach EcomStrait yet.",
    };
  }

  try {
    const res = await fetch(`${base}/api/embedded/catalog?${params}`, {
      headers: { "x-ecomstrait-secret": secret },
    });
    const data = (await res.json()) as CatalogResponse;
    if (!res.ok) {
      return { shop: session.shop, data: null, configError: data.error ?? "Couldn't load the catalog." };
    }
    return { shop: session.shop, data, configError: null };
  } catch {
    return { shop: session.shop, data: null, configError: "Couldn't reach EcomStrait." };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const productId = String(form.get("productId") ?? "");

  const { base, secret } = platform();
  if (!base || !secret) return { error: "This app isn't configured to reach EcomStrait yet." };

  try {
    const res = await fetch(`${base}/api/embedded/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecomstrait-secret": secret },
      body: JSON.stringify({ shop: session.shop, productId }),
    });
    const body = (await res.json()) as {
      status?: string;
      pushed?: boolean;
      alreadyListed?: boolean;
      error?: string;
    };
    if (!res.ok) return { error: body.error ?? "Import failed.", productId };
    return { ...body, productId };
  } catch {
    return { error: "Couldn't reach EcomStrait.", productId };
  }
};

function money(v: number | null) {
  return v != null ? `$${v.toFixed(2)}` : "—";
}

/** Two-letter initials for a supplier avatar, e.g. "Acme Supply" -> "AS". */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

/** Per-card add button — each row submits on its own so the grid stays live. */
function AddButton({ product }: { product: Product }) {
  const fetcher = useFetcher<{ status?: string; error?: string; alreadyListed?: boolean }>();
  const busy = fetcher.state !== "idle";
  const result = fetcher.data;
  const status = result?.status ?? product.listingStatus;

  if (result?.error) {
    return <s-text tone="critical">{result.error}</s-text>;
  }
  if (status === "approved") {
    return <s-badge tone="success" icon="check-circle">Added to store</s-badge>;
  }
  if (status === "pending") {
    return <s-badge tone="caution" icon="clock">Awaiting supplier</s-badge>;
  }
  if (status === "declined") {
    return <s-badge tone="critical" icon="alert-circle">Declined</s-badge>;
  }

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="productId" value={product.id} />
      <s-button
        type="submit"
        variant="primary"
        icon="plus-circle"
        loading={busy}
        disabled={product.available <= 0}
      >
        {product.available > 0 ? "Add to store" : "Out of stock"}
      </s-button>
    </fetcher.Form>
  );
}

export default function DiscoverPage() {
  const { data, configError } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  const category = searchParams.get("category") ?? "";
  const supplier = searchParams.get("supplier") ?? "";
  const page = data?.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  /** Every filter change resets to page 1 — an old page number would point past
   *  the end of a narrower result set. */
  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    setSearchParams(params);
  }

  if (configError) {
    return (
      <s-page heading="Discover products">
        <s-section>
          <s-banner tone="critical" heading="Can't load the catalog">
            <s-paragraph>{configError}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  const products = data?.products ?? [];

  return (
    <s-page heading="Discover products to sell">
      <s-section>
        <s-banner tone="info" heading="EcomStrait beta">
          <s-paragraph>
            You&apos;re using the beta. Things may change, and the full version launches soon.
          </s-paragraph>
        </s-banner>
      </s-section>

      {!data?.linked && (
        <s-section>
          <s-banner tone="warning" heading="This shop isn't linked to a store yet">
            <s-paragraph>
              Provision your store from the EcomStrait dashboard, then products you add here will
              sync to this shop.
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      <s-section>
        <s-stack direction="inline" gap="base">
          <s-search-field
            label="Search products or suppliers"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search products or suppliers"
            value={term}
            onChange={(e: { currentTarget: { value: string } }) => setTerm(e.currentTarget.value)}
          />
          <s-button icon="search" onClick={() => apply({ q: term })}>
            Search
          </s-button>
        </s-stack>

        <s-divider />

        <s-stack direction="inline" gap="small-300" alignItems="center">
          <s-icon type="categories" tone="neutral" />
          <s-clickable-chip
            color={!category && !supplier ? "strong" : "base"}
            onClick={() => apply({ category: "", supplier: "" })}
          >
            All
          </s-clickable-chip>
          {(data?.facets?.categories ?? []).map((c) => (
            <s-clickable-chip
              key={c}
              color={category === c ? "strong" : "base"}
              onClick={() => apply({ category: c, supplier: "" })}
            >
              {c}
            </s-clickable-chip>
          ))}
        </s-stack>

        {(data?.facets?.suppliers?.length ?? 0) > 0 && (
          <s-stack direction="inline" gap="small-300" alignItems="center">
            <s-icon type="store" tone="neutral" />
            {(data?.facets?.suppliers ?? []).map((s) => (
              <s-clickable-chip
                key={s.id}
                color={supplier === s.id ? "strong" : "base"}
                onClick={() => apply({ supplier: s.id, category: "" })}
              >
                {s.name}
              </s-clickable-chip>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section heading={data ? `${data.total} product${data.total === 1 ? "" : "s"}` : "Products"}>
        {products.length === 0 ? (
          <s-box padding="large" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="small-300" alignItems="center">
              <s-icon type="search" tone="neutral" size="base" />
              <s-paragraph>No products match those filters yet.</s-paragraph>
            </s-stack>
          </s-box>
        ) : (
          <s-grid gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap="base">
            {products.map((p) => (
              <s-box key={p.id} padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="block" gap="small-300">
                  {p.image ? (
                    <s-thumbnail src={p.image} alt={p.title} size="large-100" />
                  ) : (
                    <s-box padding="large" background="subdued" borderRadius="base">
                      <s-text tone="neutral">No image</s-text>
                    </s-box>
                  )}
                  <s-stack direction="inline" gap="small-300" alignItems="center">
                    <s-avatar initials={initials(p.supplierName)} alt={p.supplierName} size="small" />
                    <s-text tone="neutral">{p.supplierName}</s-text>
                  </s-stack>
                  <s-heading>{p.title}</s-heading>
                  {p.category && (
                    <s-badge tone="neutral" icon="categories">
                      {p.category}
                    </s-badge>
                  )}
                  <s-text>
                    {money(p.price)} retail
                    {p.margin != null ? ` · ${p.margin}% margin` : ""}
                  </s-text>
                  <AddButton product={p} />
                </s-stack>
              </s-box>
            ))}
          </s-grid>
        )}

        {totalPages > 1 && (
          <s-stack direction="inline" gap="base">
            <s-button
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(page - 1));
                setSearchParams(params);
              }}
            >
              Previous
            </s-button>
            <s-text>
              Page {page} of {totalPages}
            </s-text>
            <s-button
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(page + 1));
                setSearchParams(params);
              }}
            >
              Next
            </s-button>
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}
