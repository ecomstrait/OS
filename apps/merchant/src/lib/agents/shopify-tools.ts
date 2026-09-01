import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { fetchLocations, fetchShippingState, isTokenAlive } from "@/lib/shopify";
import { resolveStoreCredentials } from "@/lib/mcp/resolve-store";

/**
 * LangChain tool wrappers around the same Shopify functions the MCP server
 * (`../mcp/shopify-server.ts`) exposes — bound to one storeId, so the agent
 * never has to be told or guess a shop/token. Kept as a separate file
 * because a LangChain tool and an MCP tool have different call shapes, even
 * though both wrap the same underlying logic.
 *
 * Deliberately READ-ONLY: `set_product_price` / `set_product_status` are
 * NOT exposed here. An autonomous agent gets write tools only once the
 * human-approval gate exists — Phase 5 in Docs/AI-Native-Migration-Plan.md.
 */
export function createShopifyTools(storeId: string) {
  const getShopStatus = tool(
    async () => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return "No connected Shopify store.";
      const [tokenAlive, shipping] = await Promise.all([
        isTokenAlive(creds.shop, creds.token),
        fetchShippingState(creds.shop, creds.token),
      ]);
      return JSON.stringify({ shop: creds.shop, tokenAlive, shipping });
    },
    {
      name: "get_shop_status",
      description: "Check whether this store's Shopify connection is alive and whether it has an active shipping rate.",
      schema: z.object({}),
    },
  );

  const listLocations = tool(
    async () => {
      const creds = await resolveStoreCredentials(storeId);
      if (!creds) return "No connected Shopify store.";
      return JSON.stringify(await fetchLocations(creds.shop, creds.token));
    },
    {
      name: "list_locations",
      description: "List this store's active Shopify locations.",
      schema: z.object({}),
    },
  );

  return [getShopStatus, listLocations];
}
