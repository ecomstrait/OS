"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Globe, ShoppingBag, Sparkles, X } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { storeThemes } from "@/content/themes";

/**
 * The theme gallery.
 *
 * The target toggle isn't cosmetic: the same theme id drives two different
 * renderers — a Liquid package on Shopify, our React storefront on a custom
 * website — and they don't look identical. Showing one preview for both would
 * mislead whichever path the merchant didn't pick.
 */

type Target = "shopify" | "custom";

const TARGETS: { id: Target; label: string; icon: typeof Globe; hint: string }[] = [
  {
    id: "shopify",
    label: "Shopify theme",
    icon: ShoppingBag,
    hint: "The Liquid theme we install on your Shopify store.",
  },
  {
    id: "custom",
    label: "Custom website",
    icon: Globe,
    hint: "The storefront we host for you — no Shopify account needed.",
  },
];

function previewUrl(themeId: string, target: Target): string {
  return target === "shopify" ? `/api/theme-preview/${themeId}` : `/preview/${themeId}`;
}

export function GalleryClient() {
  const [target, setTarget] = useState<Target>("shopify");
  const [previewing, setPreviewing] = useState<string | null>(null);

  const active = TARGETS.find((t) => t.id === target)!;
  const theme = storeThemes.find((t) => t.id === previewing);

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-ink-200 p-1">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTarget(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                target === t.id ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-500">{active.hint}</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {storeThemes.map((t) => (
          <div
            key={t.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white"
          >
            <button
              type="button"
              onClick={() => setPreviewing(t.id)}
              className="group relative h-40 w-full"
              style={{ background: t.gradient }}
              aria-label={`Preview ${t.name}`}
            >
              <span className="absolute inset-0 grid place-items-center">
                <span className="rounded-lg bg-white/85 px-3 py-1 text-sm font-bold text-ink-950">
                  {t.name}
                </span>
              </span>
              <span className="absolute inset-0 grid place-items-center bg-ink-950/40 opacity-0 transition group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink-900">
                  <Eye className="h-4 w-4" /> Preview
                </span>
              </span>
            </button>

            <div className="flex flex-1 flex-col gap-1 p-5">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-ink-950">{t.name}</p>
                <span className="text-xs font-medium text-ink-400">{t.tagline}</span>
              </div>
              <p className="text-sm text-ink-500">{t.style}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPreviewing(t.id)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                >
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <Link
                  href={`/builder?theme=${t.id}`}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <Sparkles className="h-4 w-4" /> Build
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {theme && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink-950/60 p-3 sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-ink-950">{theme.name}</p>
                <p className="text-xs text-ink-500">{active.label} preview · {theme.style}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Switching target inside the modal beats closing, toggling
                    and reopening to compare the same theme across both. */}
                <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 p-0.5">
                  {TARGETS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTarget(t.id)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                        target === t.id ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <Link
                  href={`/builder?theme=${theme.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Build with this
                </Link>
                <button
                  onClick={() => setPreviewing(null)}
                  aria-label="Close preview"
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <iframe
              // Remounts on either change, so the frame can't show a stale theme.
              key={`${theme.id}-${target}`}
              src={previewUrl(theme.id, target)}
              title={`${theme.name} ${active.label} preview`}
              className="flex-1 w-full border-0 bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </>
  );
}
