import "server-only";
import { createClient } from "@ecomstrait/auth/server";
import { productImage } from "@/lib/catalog";
import { normalizePlan } from "@/lib/store-plan";
import type { StorePlan } from "@/lib/ecomai";
import type { PreviewProduct } from "@/lib/builder-actions";
import type { StoreType } from "@ecomstrait/db";

/**
 * Reading the builder's in-progress store.
 *
 * Separate from `builder-actions.ts` because that file is `"use server"` — every
 * export there becomes a callable endpoint, and a plain read used by a server
 * component has no business being one.
 */

export type DraftStore = {
  id: string;
  name: string;
  type: StoreType;
  theme: string;
  logoUrl: string | null;
  plan: StorePlan;
  products: PreviewProduct[];
  /** ISO timestamp the TTL counts from. */
  updatedAt: string;
};

/**
 * The draft the builder should open with: the one named by `draftId`, or the
 * merchant's most recent if none is named.
 *
 * Returns null when there's nothing to resume, which is the ordinary case for
 * a merchant starting a store — the builder just opens empty.
 */
export async function loadDraftStore(
  userId: string,
  draftId?: string | null,
): Promise<DraftStore | null> {
  const supabase = await createClient();

  let q = supabase
    .from("stores")
    .select("id, name, type, theme, content, logo_url, draft_products, updated_at")
    .eq("user_id", userId)
    .eq("status", "draft")
    .is("launched_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (draftId) q = q.eq("id", draftId);

  const { data: rows } = await q;
  const store = rows?.[0];
  if (!store) return null;

  // `draft_products` is plain JSON, so it's whatever was last written — treat
  // it as untrusted rather than assuming the shape the type claims.
  const picks = (Array.isArray(store.draft_products) ? store.draft_products : []).filter(
    (p): p is { id: string; price: number | null } => Boolean(p) && typeof p?.id === "string",
  );
  const ids = picks.map((p) => p.id);

  let products: PreviewProduct[] = [];
  if (ids.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, title, images, retail_price, category")
      .in("id", ids);

    const priceById = new Map(picks.map((p) => [p.id, p.price]));
    // Ordered by the merchant's picks, not by whatever the database returns, so
    // resuming shows the same preview they left. Anything since unpublished or
    // deleted simply drops out.
    const byId = new Map((prods ?? []).map((p) => [p.id, p]));
    products = ids.flatMap((id) => {
      const p = byId.get(id);
      if (!p) return [];
      return [
        {
          id: p.id,
          title: p.title,
          price: priceById.get(id) ?? p.retail_price,
          image: productImage(p.images?.[0]),
          category: p.category,
        },
      ];
    });
  }

  const name = store.name ?? "Your store";
  return {
    id: store.id,
    name,
    type: store.type,
    theme: store.theme ?? "",
    logoUrl: store.logo_url,
    plan: normalizePlan(store.content, name),
    products,
    updatedAt: store.updated_at,
  };
}
