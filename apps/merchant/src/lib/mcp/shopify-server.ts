/**
 * Shopify tools, exposed over MCP.
 *
 * Lives in this app, not `@ecomstrait/ai` — it wraps `@/lib/shopify.ts`,
 * which is merchant-app-local. Packages depend on apps in this monorepo
 * never the other way around, so an MCP server this specific to one app's
 * domain logic has to live next to that logic. `@ecomstrait/ai/mcp` stays
 * for servers with no app-specific dependency (e.g. the Supabase read-only
 * SQL tool).
 *
 * One server instance per request (see app/api/mcp/shopify/route.ts) — this
 * factory, not a singleton, is the correct shape for that.
 *
 * Write tools (`set_product_price`, `set_product_status`) are NOT yet gated
 * by a human-approval step — that lands in Phase 5
 * (Docs/AI-Native-Migration-Plan.md). Do not wire an autonomous agent to
 * this server until that guardrail exists.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  fetchLocations,
  fetchShippingState,
  isTokenAlive,
  setShopifyProductPrice,
  setShopifyProductStatus,
} from "@/lib/shopify";
import { resolveStoreCredentials } from "./resolve-store";

const NOT_CONNECTED = (storeId: string) => ({
  content: [{ type: "text" as const, text: `No connected Shopify store found for storeId ${storeId}.` }],
  isError: true as const,
});

export function createShopifyMcpServer(): McpServer {
  const server = new McpServer({ name: "ecomstrait-shopify", version: "0.1.0" });

  server.registerTool(
    "get_shop_status",
    {
      title: "Get shop status",
      description:
        "Check whether a store's Shopify connection is alive and whether it has an active shipping rate.",
      inputSchema: { storeId: z.string().uuid() },
    },
    async ({ storeId }) => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return NOT_CONNECTED(storeId);
      const [tokenAlive, shipping] = await Promise.all([
        isTokenAlive(creds.shop, creds.token),
        fetchShippingState(creds.shop, creds.token),
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ shop: creds.shop, tokenAlive, shipping }) }] };
    },
  );

  server.registerTool(
    "list_locations",
    {
      title: "List shop locations",
      description: "List this store's active Shopify locations.",
      inputSchema: { storeId: z.string().uuid() },
    },
    async ({ storeId }) => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return NOT_CONNECTED(storeId);
      const locations = await fetchLocations(creds.shop, creds.token);
      return { content: [{ type: "text", text: JSON.stringify(locations) }] };
    },
  );

  server.registerTool(
    "set_product_price",
    {
      title: "Set product price",
      description: "Set a product's selling price. WRITE ACTION — not yet approval-gated (Phase 5).",
      inputSchema: { storeId: z.string().uuid(), productGid: z.string(), price: z.number().positive() },
    },
    async ({ storeId, productGid, price }) => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return NOT_CONNECTED(storeId);
      const result = await setShopifyProductPrice(creds.shop, creds.token, productGid, price);
      return { content: [{ type: "text", text: JSON.stringify(result) }], isError: !result.ok };
    },
  );

  server.registerTool(
    "set_product_status",
    {
      title: "Set product status",
      description: "Publish (ACTIVE) or hide (DRAFT) a product. WRITE ACTION — not yet approval-gated (Phase 5).",
      inputSchema: { storeId: z.string().uuid(), productGid: z.string(), status: z.enum(["ACTIVE", "DRAFT"]) },
    },
    async ({ storeId, productGid, status }) => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return NOT_CONNECTED(storeId);
      const result = await setShopifyProductStatus(creds.shop, creds.token, productGid, status);
      return { content: [{ type: "text", text: JSON.stringify(result) }], isError: !result.ok };
    },
  );

  return server;
}
