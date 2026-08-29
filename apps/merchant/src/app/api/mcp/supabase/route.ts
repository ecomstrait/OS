import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createSupabaseMcpServer } from "@ecomstrait/ai/mcp";

export const maxDuration = 30;

/** Stateless Streamable HTTP — see api/mcp/shopify/route.ts for why. */
async function handle(req: Request): Promise<Response> {
  const server = createSupabaseMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
