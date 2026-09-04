import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { loadChatThread } from "@ecomstrait/ai";
import { productImage } from "@/lib/catalog";
import { normalizePlan } from "@/lib/store-plan";
import { getEntitlements } from "@/lib/entitlements";
import { DEFAULT_THEME_ID } from "@/content/themes";
import { StoreBuilder, type ExistingStore } from "@/components/builder/store-builder";
import type { PreviewProduct } from "@/lib/builder-actions";
import { listStorePagesWithBody } from "@/lib/pages-api";
import { listPublishedPostsWithBody } from "@/lib/blog-api";

export const metadata: Metadata = { title: "Edit store" };

// The "Edit with EcomAI" chat calls `editStore`, which — behind
// AI_ADVISOR_ENABLED — can invoke the LangGraph orchestrator: several
// sequential tool calls, each a full model round trip. Measured 8-90s in
// testing (Docs/AI-Native-Migration-Plan.md, Phase 4). A Server Action's
// duration is governed by the route segment it's bound to, not the action
// file — this must live here, not in builder-actions.ts. Note the platform
// ceiling: Vercel Hobby hard-caps at 60s regardless of this value; Pro
// allows up to 300s (800s with Fluid Compute). Raise the plan before raising
// this number.
export const maxDuration = 120;

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Guard before querying — the old `user!.id` threw a TypeError on an expired
  // session instead of sending the merchant to log in.
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, type, theme, content, logo_url, live_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) notFound();

  const { data: sp } = await supabase
    .from("store_products")
    .select("product_id, price")
    .eq("store_id", id);
  const ids = (sp ?? []).map((r) => r.product_id);

  let products: PreviewProduct[] = [];
  if (ids.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, title, images, retail_price, category")
      .in("id", ids);
    const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));
    products = (prods ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      price: priceMap.get(p.id) ?? p.retail_price,
      image: productImage(p.images?.[0]),
      category: p.category,
    }));
  }

  const name = store.name ?? "Your store";
  const existing: ExistingStore = {
    id: store.id,
    name,
    type: store.type,
    // A store saved before the theme picker existed has no theme — fall back
    // to the one premium theme currently on offer.
    theme: store.theme ?? DEFAULT_THEME_ID,
    logoUrl: store.logo_url,
    liveUrl: store.live_url,
    plan: normalizePlan(store.content, name),
    products,
  };

  const [e, thread, pages, posts] = await Promise.all([
    getEntitlements(),
    loadChatThread({ tenantId: user.id, agent: "merchant_builder", threadKey: store.id }),
    listStorePagesWithBody(store.id),
    listPublishedPostsWithBody(store.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Edit {name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            The same workbench you built it in — ask EcomAI for changes and they go live.
          </p>
        </div>
        <span className="text-xs font-medium text-ink-400">
          {e.tokensRemaining.toLocaleString()} AI tokens left today
        </span>
      </div>
      <StoreBuilder
        userId={user.id}
        initialTheme={existing.theme}
        canCreateStore={e.canCreateStore}
        existing={existing}
        initialChatMessages={thread.messages}
        initialPages={pages}
        initialPosts={posts}
      />
    </div>
  );
}
