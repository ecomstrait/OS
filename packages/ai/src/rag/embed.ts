import "server-only";

import { embed as gatewayEmbed } from "../gateway";
import type { EmbeddingResult } from "../types";

/** Embed a single string. Thin convenience over the batch gateway call. */
export async function embedText(text: string): Promise<EmbeddingResult> {
  const [result] = await gatewayEmbed([text]);
  return result;
}

/** Embed many strings in one gateway round trip. */
export async function embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  if (!texts.length) return [];
  return gatewayEmbed(texts);
}
