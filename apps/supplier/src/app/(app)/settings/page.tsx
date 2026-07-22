import Link from "next/link";
import type { Metadata } from "next";
import { getProfile } from "@ecomstrait/auth/session";
import { createClient } from "@ecomstrait/auth/server";

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
  const profile = await getProfile();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("owner_user_id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-950">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Your account and business details.</p>

      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Account</h2>
        <dl className="mt-2">
          <Row label="Email" value={user?.email ?? ""} />
          <Row label="Name" value={(user?.user_metadata?.full_name as string) ?? ""} />
          <Row label="Role" value={(profile?.role ?? "supplier").replace("_", " ")} />
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-950">Business profile</h2>
          {supplier?.status === "pending" && (
            <Link href="/onboarding" className="text-sm font-semibold text-brand-600 hover:underline">
              Continue onboarding
            </Link>
          )}
        </div>
        {supplier ? (
          <dl className="mt-2">
            <Row label="Business name" value={supplier.business_name ?? ""} />
            <Row label="Type" value={supplier.business_type ?? ""} />
            <Row label="Location" value={[supplier.city, supplier.country].filter(Boolean).join(", ")} />
            <Row label="Categories" value={(supplier.product_categories ?? []).join(", ")} />
            <Row label="Status" value={supplier.status.replace("_", " ")} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-ink-500">
            You haven&apos;t started onboarding yet.{" "}
            <Link href="/onboarding" className="font-semibold text-brand-600 hover:underline">
              Get started
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
