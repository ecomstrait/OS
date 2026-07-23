import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { storeThemes } from "@/content/themes";

export const metadata: Metadata = { title: "Store Gallery" };

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-ink-950">Store Gallery</h1>
      <p className="mt-1 text-sm text-ink-500">
        Pick a look — EcomAI applies it when it builds your store.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {storeThemes.map((t) => (
          <div key={t.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="relative h-40 w-full" style={{ background: t.gradient }}>
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-lg bg-white/85 px-3 py-1 text-sm font-bold text-ink-950">
                  {t.name}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-5">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-ink-950">{t.name}</p>
                <span className="text-xs font-medium text-ink-400">{t.tagline}</span>
              </div>
              <p className="text-sm text-ink-500">{t.style}</p>
              <div className="mt-4">
                <Link
                  href={`/builder?theme=${t.id}`}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <Sparkles className="h-4 w-4" /> Build with this theme
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
