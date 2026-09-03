import Link from "next/link";
import type { Metadata } from "next";
import type { SupplierMember } from "@ecomstrait/db/types";
import { getProfile } from "@ecomstrait/auth/session";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { TeamManager } from "@/components/settings/team-manager";
import { ProfileCard } from "@/components/settings/profile-card";

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
  const my = await getMySupplier();

  const { data: supplier } = my
    ? await supabase.from("suppliers").select("*").eq("id", my.supplierId).maybeSingle()
    : { data: null };

  const { data: members } =
    my?.isOwner
      ? await supabase
          .from("supplier_members")
          .select("*")
          .eq("supplier_id", my.supplierId)
          .order("created_at", { ascending: true })
      : { data: [] };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-950">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Your account, business details, and team.</p>

      <div className="mt-6">
        <ProfileCard
          userId={user?.id ?? ""}
          email={user?.email ?? ""}
          initialFullName={profile?.full_name ?? (user?.user_metadata?.full_name as string) ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>

      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Account</h2>
        <dl className="mt-2">
          <Row label="Email" value={user?.email ?? ""} />
          <Row label="Role" value={(profile?.role ?? "supplier").replace("_", " ")} />
          {my && !my.isOwner && <Row label="Access" value="Staff member" />}
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-950">Business profile</h2>
          {my?.isOwner && supplier?.status === "pending" && (
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

      {/* Team — owner only */}
      {my?.isOwner && (
        <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-950">Team</h2>
          <p className="mb-4 mt-1 text-xs text-ink-400">
            Invite staff to help manage your catalog, inventory, and requests. They&apos;ll be added
            automatically when they sign in with the invited email.
          </p>
          <TeamManager members={(members ?? []) as SupplierMember[]} />
        </section>
      )}
    </div>
  );
}
