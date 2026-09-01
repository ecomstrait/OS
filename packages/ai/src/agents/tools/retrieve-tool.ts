import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieve } from "../../rag/retrieve";

/**
 * RAG tool: search the niche KB blended with one tenant's own indexed
 * content (store catalog, past conversations, etc — whatever's been
 * embedded under that tenant). Omitting `tenantId` searches only shared
 * content (see `retrieve()`'s own scoping warning in rag/retrieve.ts).
 */
export function createRetrieveTool(opts: { tenantId?: string; sourceType?: string } = {}) {
  return tool(
    async ({ query }: { query: string }) => {
      const matches = await retrieve(query, {
        tenantId: opts.tenantId,
        sourceType: opts.sourceType,
        matchCount: 5,
      });
      if (!matches.length) return "No relevant information found.";
      return matches
        .map((m) => `[${m.sourceType}/${m.sourceId}] (similarity ${m.similarity.toFixed(2)})\n${m.content}`)
        .join("\n\n");
    },
    {
      name: "search_knowledge_base",
      description:
        "Search the knowledge base (general niche/business info, and this store's own indexed content) " +
        "for information relevant to a question.",
      schema: z.object({ query: z.string().describe("What to search for") }),
    },
  );
}
