import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { getEntitlements } from "@/lib/entitlements";
import { CoFounderChat } from "@/components/cofounder/cofounder-chat";

export const metadata: Metadata = { title: "EcomAI Co-Founder" };

export default async function CoFounderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, e] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    getEntitlements(),
  ]);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">EcomAI Co-Founder</h1>
          <p className="mt-1 text-sm text-ink-500">
            Grounded in your real stores, revenue, orders, and wallet balance — ask about growth,
            what to fix first, or how you&apos;re doing.
          </p>
        </div>
        <span className="text-xs font-medium text-ink-400">
          {e.tokensRemaining.toLocaleString()} AI tokens left today
        </span>
      </div>
      <CoFounderChat businessName={profile?.full_name ?? null} />
    </div>
  );
}
