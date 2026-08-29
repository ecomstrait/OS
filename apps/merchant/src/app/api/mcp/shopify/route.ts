import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createShopifyMcpServer } from "@/lib/mcp/shopify-server";

// Agent tool calls can chain several Shopify Admin API round trips; the
// platform default (10s) isn't enough headroom.
export const maxDuration = 60;

/**
 * Stateless Streamable HTTP: a fresh server + transport per request, no
 * session persistence. Correct for a serverless deployment target — nothing
 * here relies on the process staying warm between calls.
 */
async function handle(req: Request): Promise<Response> {
  const server = createShopifyMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
