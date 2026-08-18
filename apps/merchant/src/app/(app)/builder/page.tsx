import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { getEntitlements } from "@/lib/entitlements";
import { getSelectedProducts } from "@/lib/catalog";
import { storeThemes } from "@/content/themes";
import { StoreBuilder, type BuilderContext } from "@/components/builder/store-builder";
import { loadDraftStore } from "@/lib/drafts";
import { sweepExpiredDrafts } from "@/lib/draft-sweep";

export const metadata: Metadata = { title: "Store Builder" };

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; draft?: string }>;
}) {
  const { theme, draft } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Expire this merchant's abandoned drafts before deciding what to resume, so
  // an expired one is never offered back. Scoped to them and index-backed, and
  // it means expiry still works on a deployment with no scheduler wired up —
  // /api/cron/sweep-drafts is what bounds it for accounts that never return.
  await sweepExpiredDrafts({ userId: user.id });

  const [e, selected] = await Promise.all([getEntitlements(), getSelectedProducts()]);

  // Only honour a theme id we actually ship, so a hand-edited URL can't put the
  // builder into a state the picker can't represent.
  const preset = storeThemes.find((t) => t.id === theme);

  // Categories of the chosen products stand in for "what do you want to sell?".
  const niches = [...new Set(selected.map((p) => p.category).filter(Boolean))] as string[];

  const context: BuilderContext = {
    productCount: selected.length,
    inferredNiche: niches.slice(0, 3).join(", ") || (selected[0]?.title ?? ""),
    presetTheme: preset?.id ?? "",
    presetThemeName: preset?.name ?? "",
  };

  const skipping = context.productCount > 0 || Boolean(context.presetTheme);

  // Arriving from the gallery with a theme, or from Find Suppliers with a
  // basket, is a merchant starting something new — reloading last week's draft
  // over the top of that would be answering a question they didn't ask. `?draft`
  // is explicit, so it always wins.
  const resumable = draft || !skipping ? await loadDraftStore(user.id, draft) : null;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">EcomAI Store Builder</h1>
          <p className="mt-1 text-sm text-ink-500">
            {resumable
              ? "Your unlaunched draft is loaded — carry on where you stopped, or discard it to start fresh."
              : skipping
              ? "Picking up where you left off — I'll only ask what I don't already know."
              : "Answer a few questions and EcomAI builds your whole store."}
          </p>
        </div>
        <span className="text-xs font-medium text-ink-400">
          {e.tokensRemaining.toLocaleString()} AI tokens left today
        </span>
      </div>
      <StoreBuilder
        userId={user.id}
        initialTheme={preset?.id ?? ""}
        canCreateStore={e.canCreateStore}
        draft={resumable}
        context={context}
      />
    </div>
  );
}
