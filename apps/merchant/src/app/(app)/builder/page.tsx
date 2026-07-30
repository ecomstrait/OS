import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { getEntitlements } from "@/lib/entitlements";
import { getSelectedProducts } from "@/lib/catalog";
import { storeThemes } from "@/content/themes";
import { StoreBuilder, type BuilderContext } from "@/components/builder/store-builder";

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

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">EcomAI Store Builder</h1>
          <p className="mt-1 text-sm text-ink-500">
            {skipping
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
        context={context}
      />
    </div>
  );
}
