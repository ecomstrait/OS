"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, ArrowLeft, ExternalLink, ImageOff } from "lucide-react";
import type { StorePlan } from "@/lib/ecomai";
import { editStore } from "@/lib/builder-actions";

export type EditorProduct = { id: string; title: string; price: number | null; image: string | null };

type Msg = { role: "user" | "ai"; text: string };

const SYNC_LABEL: Record<string, string> = {
  live: "Live storefront updated",
  shopify: "Pushed to live Shopify store",
  draft: "Saved as draft",
};

export function StoreEditor({
  storeId,
  storeName,
  liveUrl,
  logoUrl,
  initialPlan,
  products,
}: {
  storeId: string;
  storeName: string;
  liveUrl: string | null;
  logoUrl: string | null;
  initialPlan: StorePlan;
  products: EditorProduct[];
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "I'm your co-founder. Tell me what to change — colours, the headline, the tagline — and I'll update your live store." },
  ]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit() {
    const text = input.trim();
    if (!text || pending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    start(async () => {
      const res = await editStore(storeId, text);
      if (res.error) {
        setMessages((m) => [...m, { role: "ai", text: `⚠️ ${res.error}` }]);
        return;
      }
      if (res.plan) setPlan(res.plan);
      const tag = res.synced ? SYNC_LABEL[res.synced] : "Saved";
      setMessages((m) => [...m, { role: "ai", text: `Done — ${res.note ?? "updated."} (${tag})` }]);
    });
  }

  const c0 = plan.brandColors?.[0] ?? "#0f172a";
  const c1 = plan.brandColors?.[1] ?? "#10b981";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)]">
      {/* Chat */}
      <div className="flex flex-col rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between border-b border-ink-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ai-50 text-ai-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-950">EcomAI</p>
              <p className="text-xs text-ink-400">Your Business Co-founder</p>
            </div>
          </div>
          <Link href="/stores" className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Stores
          </Link>
        </div>

        <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: "60vh" }}>
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "bg-brand-500 text-white" : "bg-ink-50 text-ink-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-ink-50 px-3.5 py-2 text-sm text-ink-400">
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> Updating…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-ink-50 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder='e.g. "make it navy and gold" or "change the headline to Summer Sale"'
              className="min-h-0 flex-1 resize-none rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-ai-400"
            />
            <button
              onClick={submit}
              disabled={pending || input.trim().length < 2}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
              aria-label="Send"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="flex items-center justify-between border-b border-ink-50 px-4 py-2.5">
          <span className="text-xs font-medium text-ink-400">Preview · {storeName}</span>
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
              View live <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Hero */}
          <div className="px-6 py-12 text-center text-white" style={{ background: `linear-gradient(135deg, ${c0}, ${c1})` }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} className="mx-auto mb-4 h-10 w-auto object-contain" />
            ) : (
              <p className="mb-3 text-sm font-bold uppercase tracking-widest opacity-80">{plan.storeName}</p>
            )}
            <h1 className="text-2xl font-bold sm:text-3xl">{plan.heroHeadline}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm opacity-90">{plan.heroSub}</p>
            <span className="mt-5 inline-block rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold" style={{ color: c0 }}>
              Shop now
            </span>
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {products.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-ink-400">No products in this store yet.</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-ink-100">
                  <div className="grid aspect-square place-items-center bg-ink-50 text-ink-300">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-6 w-6" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-medium text-ink-800">{p.title}</p>
                    <p className="text-sm font-bold text-ink-900">{p.price != null ? `$${p.price}` : "—"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
