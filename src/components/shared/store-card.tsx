import { ArrowUpRight, Monitor, Smartphone } from "lucide-react";
import type { StoreTemplate } from "@/content/gallery";

export function StoreCard({ store }: { store: StoreTemplate }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-ink-950/10">
      {/* Preview */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${store.gradient[0]}, ${store.gradient[1]})` }}
      >
        {/* Faux storefront */}
        <div className="absolute inset-4 rounded-xl bg-white/80 p-3 shadow-lg backdrop-blur transition-transform duration-500 group-hover:scale-[1.03]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: store.accent }}>
              {store.name}
            </span>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
            </div>
          </div>
          <div className="mt-2 h-10 rounded-md" style={{ background: `${store.accent}22` }} />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square rounded-md bg-ink-100/80" />
            ))}
          </div>
        </div>
        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/0 opacity-0 transition-all duration-300 group-hover:bg-ink-950/40 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink-950 shadow-lg">
            <Monitor className="h-3.5 w-3.5" /> Live Preview
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-950 shadow-lg">
            <Smartphone className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-bold text-ink-950">{store.name}</p>
          <p className="text-xs text-ink-400">{store.category} · {store.tagline}</p>
        </div>
        <a
          href="/store-owners"
          aria-label={`Build a store like ${store.name}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-600 transition group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white"
        >
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
