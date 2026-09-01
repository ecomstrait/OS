import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { PendingGate } from "@/components/app/pending-gate";
import { getEntitlements } from "@/lib/entitlements";
import { CoFounderChat } from "@/components/cofounder/cofounder-chat";

export const metadata: Metadata = { title: "EcomAI Co-Founder" };

export default async function CoFounderPage() {
  const supabase = await createClient();
  const my = await getMySupplier();

  const { data: supplier } = my
    ? await supabase.from("suppliers").select("status, business_name").eq("id", my.supplierId).maybeSingle()
    : { data: null };

  if (!supplier || supplier.status !== "approved") {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-ink-950">EcomAI Co-Founder</h1>
        <p className="mt-1 text-sm text-ink-500">Chat with your AI advisor about your business.</p>
        <div className="mt-6">
          <PendingGate status={supplier?.status ?? null} feature="the AI Co-Founder" />
        </div>
      </div>
    );
  }

  const e = await getEntitlements();

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">EcomAI Co-Founder</h1>
          <p className="mt-1 text-sm text-ink-500">
            Grounded in your real revenue, orders, catalog, and quality data — ask about growth, pricing,
            fulfilment, or what to fix first.
          </p>
        </div>
        <span className="text-xs font-medium text-ink-400">
          {e.tokensRemaining.toLocaleString()} AI tokens left today
        </span>
      </div>
      <CoFounderChat businessName={supplier.business_name} />
    </div>
  );
}
