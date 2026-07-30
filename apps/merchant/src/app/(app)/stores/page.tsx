import type { Metadata } from "next";
import Link from "next/link";
import { Store, Sparkles, Globe } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreStatus, StoreType } from "@ecomstrait/db";
import { StorePreview } from "@/components/stores/store-preview";
import { MakeItYoursButton } from "@/components/stores/make-it-yours-button";
import { StoreActions } from "@/components/stores/store-actions";

export const metadata: Metadata = { title: "Stores" };

const TYPE_LABEL: Record<StoreType, string> = {
  own_platform: "Own website",
  shopify_liquid_theme: "Shopify · EcomStrait theme",
  shopify_shopify_theme: "Shopify · Shopify theme",
};

const STATUS_STYLE: Record<StoreStatus, string> = {
  draft: "bg-ink-100 text-ink-500",
  building: "bg-ai-50 text-ai-700",
  ready_for_review: "bg-amber-50 text-amber-700",
  live: "bg-brand-50 text-brand-700",
  archived: "bg-ink-100 text-ink-400",
};

export default async function StoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, type, status, theme, live_url, shopify_store_id, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = stores ?? [];

  // For provisioned Shopify stores, pull the linked dev store's domain +
  // storefront password (dev stores are password-locked). Owner RLS lets the
  // merchant read only their own assigned rows.
  const shopifyIds = list.map((s) => s.shopify_store_id).filter(Boolean) as string[];
  const shopById = new Map<
    string,
    {
      shop_domain: string;
      storefront_password: string | null;
      status: string;
      transfer_email: string | null;
      theme_id: string | null;
    }
  >();
  if (shopifyIds.length) {
    const { data: shops } = await supabase
      .from("shopify_stores")
      .select("id, shop_domain, storefront_password, status, transfer_email, theme_id")
      .in("id", shopifyIds);
    (shops ?? []).forEach((sh) =>
      shopById.set(sh.id, {
        shop_domain: sh.shop_domain,
        storefront_password: sh.storefront_password,
        status: sh.status,
        transfer_email: sh.transfer_email,
        theme_id: sh.theme_id,
      }),
    );
  }

  // Which stores have taken payments — those get archived rather than deleted.
  const { data: paid } = await supabase
    .from("store_orders")
    .select("store_id")
    .in("store_id", list.map((s) => s.id).length ? list.map((s) => s.id) : ["00000000-0000-0000-0000-000000000000"]);
  const withOrders = new Set((paid ?? []).map((o) => o.store_id));

  // Our Shopify partner referral link — merchants sign up through it.
  const referralUrl =
    process.env.NEXT_PUBLIC_SHOPIFY_REFERRAL_URL || "https://www.shopify.com/free-trial";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Stores</h1>
          <p className="mt-1 text-sm text-ink-500">Your stores and their status.</p>
        </div>
        <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Sparkles className="h-4 w-4" /> Build a store
        </Link>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <Store className="h-7 w-7" />
            </span>
            <p className="mt-4 max-w-sm text-sm text-ink-500">No stores yet. Build your first with EcomAI.</p>
            <Link href="/builder" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              <Sparkles className="h-4 w-4" /> Open Store Builder
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {list.map((s) => {
              const shop = s.shopify_store_id ? shopById.get(s.shopify_store_id) : undefined;
              return (
              <div key={s.id} className="flex items-center justify-between gap-4 border-b border-ink-50 px-4 py-4 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-100 text-ink-500">
                    {s.type === "own_platform" ? <Globe className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="font-medium text-ink-900">{s.name}</p>
                    <p className="text-xs text-ink-400">{TYPE_LABEL[s.type]}{s.theme ? ` · ${s.theme}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {shop ? (
                    <StorePreview
                      url={`https://${shop.shop_domain}`}
                      password={shop.storefront_password}
                    />
                  ) : (
                    s.live_url && (
                      <a
                        href={s.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        View store ↗
                      </a>
                    )
                  )}
                  {/* Transfer state is a status, not an action — it stays on the row. */}
                  {shop && (shop.status === "transferred" || shop.status === "waiting_for_transfer") && (
                    <MakeItYoursButton
                      storeId={s.id}
                      referralUrl={referralUrl}
                      requestedEmail={shop.status === "waiting_for_transfer" ? shop.transfer_email : null}
                      transferred={shop.status === "transferred"}
                    />
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>
                    {s.status.replace(/_/g, " ")}
                  </span>
                  <StoreActions
                    storeId={s.id}
                    storeName={s.name ?? "Untitled store"}
                    needsProvision={
                      s.type.startsWith("shopify") &&
                      (!s.shopify_store_id ||
                        (s.type === "shopify_liquid_theme" && !shop?.theme_id))
                    }
                    isLinked={Boolean(s.shopify_store_id)}
                    hasShopify={Boolean(s.shopify_store_id)}
                    isLiquidTheme={s.type === "shopify_liquid_theme"}
                    hasOrders={withOrders.has(s.id)}
                    referralUrl={referralUrl}
                    transferEmail={shop?.status === "waiting_for_transfer" ? shop.transfer_email : null}
                    transferred={shop?.status === "transferred"}
                  />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
