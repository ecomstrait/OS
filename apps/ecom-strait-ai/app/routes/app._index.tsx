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
const SERVICES: { icon: "wand" | "team" | "rocket" | "code"; title: string; body: string }[] = [
  {
    icon: "wand",
    title: "AI Website Builder",
    body: "A complete, on-brand store from a single prompt — pages, collections and copy.",
  },
  {
    icon: "team",
    title: "Supplier network",
    body: "Verified suppliers with central catalogs and automated publishing.",
  },
  {
    icon: "rocket",
    title: "Launch specialist",
    body: "We configure payments, shipping, taxes and domains so you can sell on day one.",
  },
  {
    icon: "code",
    title: "Shopify development",
    body: "Custom themes and apps, wired into the EcomStrait supplier network.",
  },
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
          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap="base">
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-300">
                <s-badge tone="success" size="large-100" icon="check-circle">
                  {String(counts.approved)}
                </s-badge>
                <s-text tone="neutral">Live products</s-text>
              </s-stack>
            </s-box>
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-300">
                <s-badge tone="caution" size="large-100" icon="clock">
                  {String(counts.pending)}
                </s-badge>
                <s-text tone="neutral">Awaiting supplier</s-text>
              </s-stack>
            </s-box>
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-300">
                <s-badge tone="info" size="large-100" icon="categories">
                  {String(data.catalogSize)}
                </s-badge>
                <s-text tone="neutral">Available to add</s-text>
              </s-stack>
            </s-box>
          </s-grid>

          {counts.pending > 0 && (
            <s-stack direction="inline" gap="small-300" alignItems="center">
              <s-icon type="clock" tone="caution" />
              <s-paragraph>
                {counts.pending} product{counts.pending === 1 ? " is" : "s are"} waiting on supplier
                approval. They appear in this shop automatically once approved.
              </s-paragraph>
            </s-stack>
          )}
          {counts.declined > 0 && (
            <s-stack direction="inline" gap="small-300" alignItems="center">
              <s-icon type="alert-circle" tone="critical" />
              <s-paragraph>
                {counts.declined} request{counts.declined === 1 ? " was" : "s were"} declined — your
                dashboard shows the supplier&apos;s reason.
              </s-paragraph>
            </s-stack>
          )}

          <s-stack direction="inline" gap="base">
            <Link to="/app/discover">
              <s-button variant="primary" icon="search">
                Discover products
              </s-button>
            </Link>
            {dashboard && (
              <s-button href={dashboard} target="_blank" icon="external">
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
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {SERVICES.map((service) => (
            <s-box key={service.title} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-300">
                <s-icon type={service.icon} tone="info" />
                <s-text>{service.title}</s-text>
                <s-text tone="neutral">{service.body}</s-text>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
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
          <s-button href={data.merchantUrl} target="_blank" icon="chat">
            Talk to us
          </s-button>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
