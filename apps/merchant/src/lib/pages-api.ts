import "server-only";

import { createAdminClient } from "@ecomstrait/db";

/** Public reads of a store's custom pages — created via the EcomAI chat (see applyPageAction in builder-actions.ts). */

export type PageSummary = { slug: string; title: string };
export type PageDetail = PageSummary & { body: string };

/** Every page on a store, for the nav — no status/visibility gate, a page exists the moment chat creates it. */
export async function listStorePages(storeId: string): Promise<PageSummary[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("store_pages")
    .select("slug, title")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[pages-api] could not list pages:", error.message);
    return [];
  }
  return data ?? [];
}

/** A single page by slug, or null if it doesn't exist on this store. */
export async function getStorePage(storeId: string, slug: string): Promise<PageDetail | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("store_pages")
    .select("slug, title, body")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[pages-api] could not read page:", error.message);
    return null;
  }
  return data ?? null;
}
