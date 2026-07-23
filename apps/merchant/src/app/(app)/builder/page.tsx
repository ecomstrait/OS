import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { getEntitlements } from "@/lib/entitlements";
import { StoreBuilder } from "@/components/builder/store-builder";

export const metadata: Metadata = { title: "Store Builder" };

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const e = await getEntitlements();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">EcomAI Store Builder</h1>
          <p className="mt-1 text-sm text-ink-500">
            Answer a few questions and EcomAI builds your whole store.
          </p>
        </div>
        <span className="text-xs font-medium text-ink-400">
          {e.tokensRemaining.toLocaleString()} AI tokens left today
        </span>
      </div>
      <StoreBuilder userId={user.id} initialTheme={theme ?? ""} canCreateStore={e.canCreateStore} />
    </div>
  );
}
