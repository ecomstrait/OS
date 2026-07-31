import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { merchantBaseUrl } from "../merchant-url.server";

/**
 * EcomStrait home inside Shopify admin.
 *
 * Replaces the app template's demo screen. A merchant opening this should see
 * where their store stands, what EcomStrait does for them, and the one action
 * that matters — find products to sell. Copy mirrors the marketing site so the
 * story is the same in both places.
 */

type Overview = {
  linked: boolean;
  shopDomain: string;
  merchantUrl: string;
  store?: { id?: string; name?: string; type?: string; status?: string; liveUrl?: string | null };
  counts: { approved: number; pending: number; declined: number };
  catalogSize: number;
  error?: string;
};

/** Mirrors `howItWorks` on the marketing site. */
const HOW_IT_WORKS = [
  "Verified suppliers publish their catalog, enriched by EcomAI.",
  "You pick products — or ask EcomAI to build a whole store for your niche.",
  "The supplier approves, and the product syncs here with price, images and stock.",
  "You sell it; the supplier ships it.",
];

/** Mirrors the services section on the marketing site. */
const SERVICES: [string, string][] = [
  ["AI Website Builder", "A complete, on-brand store from a single prompt — pages, collections and copy."],
  ["Supplier network", "Verified suppliers with central catalogs and automated publishing."],
  ["Launch specialist", "We configure payments, shipping, taxes and domains so you can sell on day one."],
  ["Shopify development", "Custom themes and apps, wired into the EcomStrait supplier network."],
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const base = merchantBaseUrl();
  const secret = process.env.ECOMSTRAIT_SHARED_SECRET;

  if (!base || !secret) {
    return { data: null, configError: "This app isn't configured to reach EcomStrait yet." };
  }

  try {
    const res = await fetch(
      `${base}/api/embedded/overview?shop=${encodeURIComponent(session.shop)}`,
      { headers: { "x-ecomstrait-secret": secret } },
    );
    const data = (await res.json()) as Overview;
    if (!res.ok) return { data: null, configError: data.error ?? "Couldn't load your store." };
    return { data, configError: null };
  } catch {
    return { data: null, configError: "Couldn't reach EcomStrait." };
  }
};

export default function AppHome() {
  const { data, configError } = useLoaderData<typeof loader>();

  const counts = data?.counts ?? { approved: 0, pending: 0, declined: 0 };
  const dashboard = data?.merchantUrl ? `${data.merchantUrl}/stores` : null;

  return (
    <s-page heading="EcomStrait — your AI ecommerce co-founder">
      <s-section>
        <s-banner tone="info" heading="EcomStrait beta">
          <s-paragraph>
            You&apos;re using the beta. Things may change, and the full version launches soon.
          </s-paragraph>
        </s-banner>
      </s-section>

      {configError ? (
        <s-section>
          <s-banner tone="critical" heading="Can't reach EcomStrait">
            <s-paragraph>{configError}</s-paragraph>
          </s-banner>
        </s-section>
      ) : !data?.linked ? (
        <s-section heading="Connect this shop">
          <s-paragraph>
            This shop isn&apos;t linked to an EcomStrait store yet. Build and provision a store from
            your dashboard, then everything you add here syncs straight into it.
          </s-paragraph>
          {dashboard && (
            <s-button href={dashboard} target="_blank" variant="primary">
              Open EcomStrait dashboard
            </s-button>
          )}
        </s-section>
      ) : (
        <s-section heading={data.store?.name ?? "Your store"}>
          <s-stack direction="inline" gap="large">
            <s-stack direction="block" gap="small-300">
              <s-text tone="neutral">Live products</s-text>
              <s-heading>{counts.approved}</s-heading>
            </s-stack>
            <s-stack direction="block" gap="small-300">
              <s-text tone="neutral">Awaiting supplier</s-text>
              <s-heading>{counts.pending}</s-heading>
            </s-stack>
            <s-stack direction="block" gap="small-300">
              <s-text tone="neutral">Available to add</s-text>
              <s-heading>{data.catalogSize}</s-heading>
            </s-stack>
          </s-stack>

          {counts.pending > 0 && (
            <s-paragraph>
              {counts.pending} product{counts.pending === 1 ? " is" : "s are"} waiting on supplier
              approval. They appear in this shop automatically once approved.
            </s-paragraph>
          )}
          {counts.declined > 0 && (
            <s-paragraph>
              {counts.declined} request{counts.declined === 1 ? " was" : "s were"} declined — your
              dashboard shows the supplier&apos;s reason.
            </s-paragraph>
          )}

          <s-stack direction="inline" gap="base">
            <Link to="/app/discover">
              <s-button variant="primary">Discover products</s-button>
            </Link>
            {dashboard && (
              <s-button href={dashboard} target="_blank">
                Open dashboard
              </s-button>
            )}
          </s-stack>
        </s-section>
      )}

      <s-section heading="What EcomStrait does">
        <s-paragraph>
          We connect verified suppliers to store owners, and let AI do the heavy lifting in between —
          from building the store to enriching every product.
        </s-paragraph>
        <s-unordered-list>
          {SERVICES.map(([title, description]) => (
            <s-list-item key={title}>
              <s-text>{title}</s-text> — {description}
            </s-list-item>
          ))}
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="How it works">
        <s-ordered-list>
          {HOW_IT_WORKS.map((step) => (
            <s-list-item key={step}>{step}</s-list-item>
          ))}
        </s-ordered-list>
      </s-section>

      <s-section slot="aside" heading="Need a hand?">
        <s-paragraph>
          Our launch specialists set up payments, shipping, taxes and your domain so the store is
          ready to sell.
        </s-paragraph>
        {data?.merchantUrl && (
          <s-button href={data.merchantUrl} target="_blank">
            Talk to us
          </s-button>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
