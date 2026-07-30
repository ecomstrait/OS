"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Send, Store, Globe, ShoppingBag, ImageOff, ImagePlus, X, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { createClient } from "@ecomstrait/auth/client";
import type { StoreType } from "@ecomstrait/db";
import { storeThemes } from "@/content/themes";
import {
  buildStore,
  refineStore,
  createStore,
  editStore,
  updateStore,
  type PreviewProduct,
} from "@/lib/builder-actions";
import type { StorePlan } from "@/lib/ecomai";
import { VersionHistory } from "@/components/builder/version-history";

/**
 * An already-launched store, opened in the same workbench used to build it.
 * When present the question flow is skipped and the chat edits the live store.
 */
export type ExistingStore = {
  id: string;
  name: string;
  type: StoreType;
  theme: string;
  logoUrl: string | null;
  liveUrl: string | null;
  plan: StorePlan;
  products: PreviewProduct[];
};

type Msg = { id: number; role: "ai" | "user"; content: string };

const ALL_QUESTIONS: { key: keyof Answers; q: string }[] = [
  { key: "niche", q: "What do you want to sell?" },
  { key: "audience", q: "Who are your customers, and which country are you targeting? (or say “skip”)" },
  { key: "style", q: "What style fits your brand — modern, luxury, playful, something else? (or “skip”)" },
  { key: "storeName", q: "What should we name the store? Say “you pick” and I'll choose — and upload a logo below if you have one." },
];

type Answers = { niche: string; audience: string; style: string; storeName: string };

/**
 * What the merchant already decided before arriving here — products picked in
 * Find Suppliers, a theme chosen in the gallery. Those questions get skipped
 * rather than asked again.
 */
export type BuilderContext = {
  /** Products already selected; suppresses the "what do you want to sell?" step. */
  productCount: number;
  /** Niche inferred from the selection, used in place of the answer. */
  inferredNiche: string;
  /** Theme chosen in the gallery; suppresses the style question. */
  presetTheme: string;
  presetThemeName: string;
};

const PATHS: { type: StoreType; label: string; icon: typeof Store }[] = [
  { type: "own_platform", label: "Own website", icon: Globe },
  { type: "shopify_liquid_theme", label: "Shopify + our theme", icon: Store },
  { type: "shopify_shopify_theme", label: "Shopify theme", icon: Store },
];

const isSkip = (s: string) => /^(skip|none|no|na|-)$/i.test(s.trim());

export function StoreBuilder({
  userId,
  initialTheme,
  canCreateStore,
  existing,
  context,
}: {
  userId: string;
  initialTheme: string;
  canCreateStore: boolean;
  existing?: ExistingStore;
  context?: BuilderContext;
}) {
  const router = useRouter();
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const editing = Boolean(existing);

  // Questions the merchant has effectively already answered elsewhere.
  const skipped = useMemo(() => {
    const keys = new Set<keyof Answers>();
    if (context?.productCount) keys.add("niche");
    if (context?.presetTheme) keys.add("style");
    return keys;
  }, [context]);

  const QUESTIONS = useMemo(
    () => ALL_QUESTIONS.filter((q) => !skipped.has(q.key)),
    [skipped],
  );

  /** Answers pre-filled from the arriving context. */
  const seeded = useMemo<Answers>(
    () => ({
      niche: context?.inferredNiche ?? "",
      audience: "",
      style: context?.presetTheme ?? "",
      storeName: "",
    }),
    [context],
  );

  const [messages, setMessages] = useState<Msg[]>(
    existing
      ? [
          {
            id: 0,
            role: "ai",
            content: `"${existing.name}" is loaded on the right. Tell me what to change — colours, the headline, the tagline — and I'll update your live store.`,
          },
        ]
      : [
          { id: 0, role: "ai", content: "Hi! I'm EcomAI, your co-founder. Let's build your store together." },
          ...(context && (context.productCount || context.presetTheme)
            ? [
                {
                  id: 1,
                  role: "ai" as const,
                  content: [
                    context.productCount
                      ? `I've got the ${context.productCount} product${context.productCount === 1 ? "" : "s"} you selected`
                      : "",
                    context.presetThemeName ? `the ${context.presetThemeName} theme` : "",
                  ]
                    .filter(Boolean)
                    .join(" and ")
                    .replace(/^./, (c) => c.toUpperCase())
                    .concat(" — so I'll skip those questions."),
                },
              ]
            : []),
          { id: 2, role: "ai", content: QUESTIONS[0]?.q ?? "Ready when you are — say “go” and I'll build it." },
        ],
  );
  const [stage, setStage] = useState<"asking" | "ready">(existing ? "ready" : "asking");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(seeded);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<StorePlan | null>(existing?.plan ?? null);
  const [products, setProducts] = useState<PreviewProduct[]>(existing?.products ?? []);

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<StoreType>(existing?.type ?? "own_platform");
  const [theme, setTheme] = useState(
    existing?.theme || context?.presetTheme || initialTheme || storeThemes[0].id,
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(existing?.logoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function pushAi(content: string) {
    setMessages((m) => [...m, { id: nextId(), role: "ai", content }]);
  }

  async function runBuild(finalAnswers: Answers) {
    setBusy(true);
    pushAi(
      context?.productCount
        ? "Perfect — building your store now around the products you picked: writing copy, generating SEO, and applying a theme…"
        : "Perfect — building your store now: picking products, writing copy, generating SEO, and applying a theme…",
    );
    const res = await buildStore(finalAnswers, { useSelected: Boolean(context?.productCount) });
    setBusy(false);
    if (res.error) {
      pushAi(res.error);
      return;
    }
    const p = res.plan!;
    setPlan(p);
    setProducts(res.products ?? []);
    setName(p.storeName);
    // A theme chosen in the gallery wins over the one EcomAI would infer.
    if (res.theme && !context?.presetTheme) setTheme(res.theme);
    setStage("ready");
    pushAi(
      `Done! I built "${p.storeName}" with ${res.products?.length ?? 0} products, a matching theme, and SEO. Take a look on the right — want any tweaks? (e.g. "make it navy", "punchier headline"). When it's ready, set how you want to sell and hit Launch my store.`,
    );
  }

  async function send() {
    const text = input.trim();
    if (text.length < 1 || busy) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { id: nextId(), role: "user", content: text }]);

    if (stage === "asking") {
      const question = QUESTIONS[qIndex];
      if (!question) {
        await runBuild(answers);
        return;
      }
      const key = question.key;
      const value = isSkip(text) ? "" : text;
      const updated = { ...answers, [key]: value };
      setAnswers(updated);

      if (qIndex < QUESTIONS.length - 1) {
        const nextQ = qIndex + 1;
        setQIndex(nextQ);
        pushAi(QUESTIONS[nextQ].q);
      } else {
        await runBuild(updated);
      }
      return;
    }

    // ready → cosmetic refinement
    if (!plan) return;
    setBusy(true);

    // Editing a launched store persists and propagates; building only updates
    // the in-memory preview until "Launch my store".
    if (existing) {
      const res = await editStore(existing.id, text);
      setBusy(false);
      if (res.error) {
        pushAi(`⚠️ ${res.error}`);
        return;
      }
      if (res.plan) setPlan(res.plan);
      pushAi(`Done — ${res.note ?? "updated."}`);
      router.refresh();
      return;
    }

    const res = await refineStore(plan, text);
    setBusy(false);
    if (res.error) {
      pushAi(res.error);
      return;
    }
    setPlan(res.plan!);
    pushAi("Updated — check the preview.");
  }

  async function onLogo(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("store-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const url = supabase.storage.from("store-logos").getPublicUrl(path).data.publicUrl;
      // cache-bust so a re-upload shows immediately
      setLogoUrl(`${url}?v=${file.size}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  /** Edit mode: persist the settings that aren't part of the AI plan. */
  async function save() {
    if (!existing) return;
    setSaving(true);
    setError(null);
    setSavedAt(false);
    const res = await updateStore(existing.id, { name, theme, logoUrl });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSavedAt(true);
    if (res.note) pushAi(res.note);
    router.refresh();
  }

  async function create() {
    if (!plan) return;
    setSaving(true);
    setError(null);
    const res = await createStore({
      name,
      type,
      theme,
      logoUrl,
      plan,
      products: products.map((p) => ({ id: p.id, price: p.price })),
    });
    if (res && "error" in res && res.error) {
      setError(res.error);
      setSaving(false);
    } else {
      router.refresh();
    }
  }

  const grad = plan
    ? `linear-gradient(135deg, ${plan.brandColors[0] ?? "#0f172a"}, ${plan.brandColors[1] ?? "#10b981"})`
    : undefined;

  return (
    <div className="flex h-[80vh] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl shadow-ink-950/5 lg:flex-row">
      {/* ---- Left: chat ---- */}
      <div className="flex h-1/2 w-full flex-col border-b border-ink-100 lg:h-full lg:w-[38%] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-ai-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-950">EcomAI</p>
              <p className="text-xs text-ink-400">Your Business Co-founder</p>
            </div>
          </div>
          {editing && (
            <Link
              href="/stores"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Stores
            </Link>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.role === "user" ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-800")}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-ink-100 px-3.5 py-2 text-sm text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-ink-100 p-3">
          <div className="flex items-end gap-2 rounded-xl border border-ink-200 bg-white p-1.5">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={stage === "ready" ? "Ask for a tweak…" : "Type your answer…"}
              className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-400"
            />
            <button onClick={send} disabled={busy || input.trim().length < 1} aria-label="Send" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
          {/* Logo import */}
          <div className="mt-2 flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {logoUrl ? "Change logo" : "Upload logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
            </label>
            {logoUrl && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2 py-1 text-xs text-ink-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="logo" className="h-4 w-4 rounded object-contain" /> Logo added
                <button onClick={() => setLogoUrl(null)} aria-label="Remove logo"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- Right: preview + action bar ---- */}
      <div className="flex h-1/2 flex-1 flex-col bg-ink-50/50 lg:h-full">
        <div className="flex-1 overflow-y-auto">
          {!plan ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div className="max-w-xs">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
                  <Store className="h-7 w-7" />
                </span>
                <p className="mt-4 text-sm text-ink-500">Answer EcomAI&apos;s questions and your full store appears here.</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                  <span className="ml-2 truncate text-xs text-ink-400">{name || plan.storeName}</span>
                </div>

                <div className="px-6 py-10 text-center text-white" style={{ background: grad }}>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Store logo" className="mx-auto mb-4 h-10 object-contain" />
                  ) : (
                    <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white/90">{name || plan.storeName}</p>
                  )}
                  <p className="text-lg font-bold sm:text-2xl">{plan.heroHeadline}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-white/85">{plan.heroSub}</p>
                  <span className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink-950">Shop now</span>
                </div>

                <div className="flex flex-wrap justify-center gap-2 px-6 py-4">
                  {plan.collections.map((c) => (
                    <span key={c} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">{c}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-3">
                  {(products.length ? products : Array.from({ length: 3 }).map((_, i) => ({ id: `x${i}`, title: "Product", price: null, image: null }))).slice(0, 6).map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-lg border border-ink-100">
                      <div className="aspect-square bg-ink-50">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-ink-300"><ImageOff className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-1 text-xs font-medium text-ink-800">{p.title}</p>
                        <p className="text-xs text-ink-500">{p.price != null ? `$${p.price}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink-100 px-6 py-5 text-center">
                  <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-500">{plan.about}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-ink-100 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" aria-label="Store name" disabled={!plan} className="h-9 w-36 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 disabled:opacity-50" />
            {/* Selling path is fixed once a store exists — switching it after
                provisioning would orphan the Shopify store it's tied to. */}
            {editing ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-600">
                {(() => {
                  const p = PATHS.find((x) => x.type === type);
                  const Icon = p?.icon ?? Store;
                  return (
                    <>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{p?.label ?? type}</span>
                    </>
                  );
                })()}
              </span>
            ) : (
              <div className="flex items-center gap-1 rounded-lg border border-ink-200 p-0.5">
                {PATHS.map((p) => (
                  <button key={p.type} type="button" onClick={() => setType(p.type)} disabled={!plan} title={p.label} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50", type === p.type ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100")}>
                    <p.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{p.label}</span>
                  </button>
                ))}
              </div>
            )}
            <select value={theme} onChange={(e) => { setTheme(e.target.value); setSavedAt(false); }} disabled={!plan} aria-label="Theme" className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400 disabled:opacity-50">
              {storeThemes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {editing ? (
              <div className="ml-auto flex items-center gap-2">
                {existing && (
                  <VersionHistory
                    storeId={existing.id}
                    onRestored={(note) => {
                      pushAi(note);
                      router.refresh();
                    }}
                  />
                )}
                {existing?.liveUrl && (
                  <a
                    href={existing.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    View live <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button onClick={save} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAt ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
                </button>
              </div>
            ) : (
              <button onClick={create} disabled={!plan || saving || !canCreateStore} className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingBag className="h-4 w-4" /> Launch my store</>}
              </button>
            )}
          </div>
          {!editing && !canCreateStore && plan && <p className="mt-2 text-xs text-amber-600">Store limit reached — upgrade in Billing to create more.</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
