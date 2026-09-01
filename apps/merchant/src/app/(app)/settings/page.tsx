import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreType } from "@ecomstrait/db";
import { domainTarget } from "@/lib/domain";
import { DomainCard } from "@/components/settings/domain-card";

export const metadata: Metadata = { title: "Settings" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-50 py-3 last:border-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, type, domain, domain_verified_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-950">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Your account and store domains.</p>

      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Account</h2>
        <dl className="mt-2">
          <Row label="Email" value={user?.email ?? ""} />
          <Row label="Name" value={(user?.user_metadata?.full_name as string) ?? ""} />
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink-950">Stores</h2>
        <p className="mt-1 text-sm text-ink-500">
          Rename a store, or connect your own domain — add the DNS records at your registrar, then
          check the connection.
        </p>
        <div className="mt-4 space-y-4">
          {(stores ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
              No stores yet. Build a store first, then connect a domain here.
            </div>
          ) : (
            (stores ?? []).map((s) => (
              <DomainCard
                key={s.id}
                storeId={s.id}
                storeName={s.name ?? "Untitled store"}
                storeType={s.type}
                initialDomain={s.domain}
                initialVerifiedAt={s.domain_verified_at}
                target={domainTarget(s.type as StoreType)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
