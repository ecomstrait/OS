import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { productImage } from "@/lib/catalog";
import { normalizePlan } from "@/lib/store-plan";
import { getEntitlements } from "@/lib/entitlements";
import { storeThemes } from "@/content/themes";
import { StoreBuilder, type ExistingStore } from "@/components/builder/store-builder";
import type { PreviewProduct } from "@/lib/builder-actions";

export const metadata: Metadata = { title: "Edit store" };

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
      .select("id, title, images, retail_price")
      .in("id", ids);
    const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));
    products = (prods ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      price: priceMap.get(p.id) ?? p.retail_price,
      image: productImage(p.images?.[0]),
    }));
  }

  const name = store.name ?? "Your store";
  const existing: ExistingStore = {
    id: store.id,
    name,
    type: store.type,
    // A store saved before the theme picker existed has no theme — fall back to
    // the first gallery entry so the select isn't blank.
    theme: store.theme ?? storeThemes[0].id,
    logoUrl: store.logo_url,
    liveUrl: store.live_url,
    plan: normalizePlan(store.content, name),
    products,
  };

  const e = await getEntitlements();

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
      />
    </div>
  );
}
