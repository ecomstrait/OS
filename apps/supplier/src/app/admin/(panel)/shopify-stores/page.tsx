import type { Metadata } from "next";
import { createAdminClient, PROMO_USER_LIMIT } from "@ecomstrait/db";
import type { ShopifyStoreStatus } from "@ecomstrait/db/types";
import { StorefrontPasswordField } from "@/components/admin/storefront-password-field";

export const metadata: Metadata = { title: "Shopify stores — Admin" };

const STATUS_STYLE: Record<ShopifyStoreStatus, string> = {
  available: "bg-brand-50 text-brand-700",
  assigned: "bg-ai-50 text-ai-700",
  building: "bg-ai-50 text-ai-700",
  ready_for_review: "bg-amber-50 text-amber-700",
  client_approved: "bg-brand-50 text-brand-700",
  waiting_for_transfer: "bg-amber-50 text-amber-700",
  transferred: "bg-ink-100 text-ink-500",
  archived: "bg-ink-100 text-ink-400",
};

export default async function AdminShopifyStoresPage() {
  const client = createAdminClient();
  if (!client) return <p className="text-sm text-red-600">Server is not configured.</p>;

  const { data: stores } = await client
    .from("shopify_stores")
    .select("id, shop_domain, status, sync_status, owner_user_id, storefront_password, created_at")
    .order("created_at", { ascending: false });

  const list = stores ?? [];

  // Beta promo: how many of the first-100 free-FULL-month slots are claimed.
  const { count: promoUsed } = await client
    .from("subscriptions")
    .select("user_id", { count: "exact", head: true })
    .eq("promo_eligible", true);
  const { count: totalSubs } = await client
    .from("subscriptions")
    .select("user_id", { count: "exact", head: true });
  const promo = promoUsed ?? 0;
  const availablePool = list.filter((s) => s.status === "available").length;

  // Map owner ids → emails for a readable "assigned to" column.
  const ownerIds = [...new Set(list.map((s) => s.owner_user_id).filter(Boolean))] as string[];
  const emailById = new Map<string, string>();
  if (ownerIds.length) {
    const { data: authList } = await client.auth.admin.listUsers({ perPage: 200 });
    (authList?.users ?? []).forEach((u) => {
      if (ownerIds.includes(u.id) && u.email) emailById.set(u.id, u.email);
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-950">Shopify stores</h1>
      <p className="mt-1 text-sm text-ink-500">
        {list.length} store{list.length === 1 ? "" : "s"} in the pool. Set each dev store&apos;s
        storefront password so its assigned merchant can preview it.
      </p>

      {/* Beta ops metrics */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-medium text-ink-400">Promo slots claimed</p>
          <p className="mt-1 text-2xl font-bold text-ink-950">
            {promo}
            <span className="text-base font-medium text-ink-400"> / {PROMO_USER_LIMIT}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-400">first-100 free FULL month</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-medium text-ink-400">Total signups</p>
          <p className="mt-1 text-2xl font-bold text-ink-950">{totalSubs ?? 0}</p>
          <p className="mt-0.5 text-xs text-ink-400">entrepreneur subscriptions</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-medium text-ink-400">Available pool</p>
          <p
            className={`mt-1 text-2xl font-bold ${availablePool < 5 ? "text-amber-600" : "text-ink-950"}`}
          >
            {availablePool}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            {availablePool < 5 ? "low — add dev stores" : "unassigned dev stores"}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-sm text-ink-500">
          No Shopify stores connected yet. They appear here once the EcomStrait app is installed on a
          dev store.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Assigned to</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Storefront password</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{s.shop_domain}</p>
                    <p className="text-xs text-ink-400">{s.sync_status ?? "—"}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 md:table-cell">
                    {s.owner_user_id ? emailById.get(s.owner_user_id) ?? "—" : "unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[s.status]}`}
                    >
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StorefrontPasswordField
                      shopifyStoreId={s.id}
                      initial={s.storefront_password}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
