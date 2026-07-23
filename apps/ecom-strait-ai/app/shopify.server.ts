import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July26,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  hooks: {
    // On install: hand the shop + access token to the EcomStrait platform and
    // register the orders webhook so purchases route to our suppliers.
    afterAuth: async ({ session, admin }) => {
      const merchant = process.env.ECOMSTRAIT_MERCHANT_URL;
      const secret = process.env.ECOMSTRAIT_SHARED_SECRET;
      if (!merchant || !secret) return;

      try {
        await fetch(`${merchant}/api/shopify/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-ecomstrait-secret": secret },
          body: JSON.stringify({
            shop: session.shop,
            accessToken: session.accessToken,
            scopes: session.scope,
          }),
        });
      } catch (e) {
        console.error("[ecomstrait] connect push failed", e);
      }

      try {
        await admin.graphql(
          `#graphql
          mutation createWebhook($topic: WebhookSubscriptionTopic!, $url: URL!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $url, format: JSON }) {
              userErrors { message }
            }
          }`,
          { variables: { topic: "ORDERS_CREATE", url: `${merchant}/api/shopify/webhooks` } },
        );
      } catch (e) {
        console.error("[ecomstrait] webhook register failed", e);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

/**
 * Push the shop + access token to the EcomStrait platform (idempotent). Called
 * from the app loader so it syncs whenever the app is open, not just on install.
 */
export async function pushConnection(session: {
  shop: string;
  accessToken?: string;
  scope?: string;
}): Promise<void> {
  const merchant = process.env.ECOMSTRAIT_MERCHANT_URL;
  const secret = process.env.ECOMSTRAIT_SHARED_SECRET;
  if (!merchant || !secret || !session.accessToken) {
    console.log("[ecomstrait] connect skipped (missing merchant url / secret / token)");
    return;
  }
  try {
    const res = await fetch(`${merchant}/api/shopify/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecomstrait-secret": secret },
      body: JSON.stringify({ shop: session.shop, accessToken: session.accessToken, scopes: session.scope }),
    });
    if (!res.ok) {
      console.error("[ecomstrait] connect push status", res.status, await res.text().catch(() => ""));
    } else {
      console.log("[ecomstrait] connected", session.shop);
    }
  } catch (e) {
    console.error("[ecomstrait] connect push failed", e);
  }
}

export default shopify;
export const apiVersion = ApiVersion.July26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
