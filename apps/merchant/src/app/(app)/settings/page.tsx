import type { Metadata } from "next";
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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-950">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Your account details.</p>
      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Account</h2>
        <dl className="mt-2">
          <Row label="Email" value={user?.email ?? ""} />
          <Row label="Name" value={(user?.user_metadata?.full_name as string) ?? ""} />
        </dl>
      </section>
    </div>
  );
}
