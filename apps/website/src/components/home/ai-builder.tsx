"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp, Sparkles, Check, Loader2, RotateCcw, Store, Lock,
  Rocket, ShieldCheck, X, TrendingUp, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { AiAvatar } from "@/components/ecomai/ai-avatar";
import { WaitlistForm } from "@/components/shared/waitlist-form";
import { track } from "@/lib/analytics";
import { availableNiches } from "@/content/niches";
import type { BusinessPlan } from "@/lib/ecomai";
import { cn } from "@/lib/utils";

const EVENT_MS = 1050;

type Phase = "idle" | "thinking" | "building" | "ready" | "beta";

/* ------------------------------------------------------------------ */
/*  Per-step "work" events EcomAI narrates on the left, each with a     */
/*  concrete result (suppliers, products + margins, SEO, checklist).    */
/* ------------------------------------------------------------------ */

type BuildEvent =
  | { key: string; doing: string; done: string; kind: "text" }
  | { key: string; doing: string; done: string; kind: "suppliers"; suppliers: number; rating: string }
  | { key: string; doing: string; done: string; kind: "products"; products: { name: string; margin: number }[] }
  | { key: string; doing: string; done: string; kind: "keywords"; keywords: string[] }
  | { key: string; doing: string; done: string; kind: "checklist"; items: string[] }
  | { key: string; doing: string; done: string; kind: "final" };

function buildEvents(plan: BusinessPlan): BuildEvent[] {
  const niche = plan.niche.toLowerCase();
  const [smin, smax] = plan.estimate.suppliers;
  const suppliers = Math.round((smin + smax) / 2);
  const [mmin, mmax] = plan.estimate.margin;
  const rating = (4.6 + ((suppliers % 4) * 0.1)).toFixed(1);

  const products = plan.productIdeas.slice(0, 4).map((name, i) => ({
    name,
    // Deterministic spread across the niche's margin range (labeled example).
    margin: Math.round(mmin + ((mmax - mmin) * ((i * 29 + 17) % 100)) / 100),
  }));

  const keywords = [
    `buy ${niche} online`,
    `best ${niche} store`,
    `${niche} free shipping`,
    `affordable ${niche}`,
  ];

  return [
    { key: "idea", doing: `Analyzing “${plan.idea}”`, done: `Got it — a ${niche} store. Strong pick.`, kind: "text" },
    { key: "suppliers", doing: "Finding verified suppliers", done: `Matched ${suppliers} verified suppliers ready to fulfil.`, kind: "suppliers", suppliers, rating },
    { key: "products", doing: "Curating best-selling products", done: `Picked ${products.length} winners with healthy margins:`, kind: "products", products },
    { key: "seo", doing: "Writing SEO & product copy", done: "Optimized copy — top keywords locked in:", kind: "keywords", keywords },
    { key: "design", doing: "Designing your storefront", done: "Brand, pages & mobile assembled.", kind: "checklist", items: ["Brand & logo", "Homepage", "Collections", "Mobile layout", "Payments & shipping"] },
    { key: "final", doing: "Finalizing your store", done: `Your ${niche} store is live in the preview →`, kind: "final" },
  ];
}

/* ================================================================== */

export function AiBuilder() {
  const reduce = useReducedMotion();
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [themeIdx, setThemeIdx] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [frameLoading, setFrameLoading] = useState(false);

  const available = availableNiches();
  const events = useMemo(() => (plan ? buildEvents(plan) : []), [plan]);
  const busy = phase === "thinking" || phase === "building";

  async function build(text: string) {
    const q = text.trim();
    if (q.length < 2 || busy) return;
    track("idea_submitted", { idea: q, source: "ai-builder" });
    setIdea(q);
    setErr(null);
    setPlan(null);
    setStep(0);
    setLaunching(false);
    setPhase("thinking");
    try {
      const res = await fetch("/api/ecomai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: q }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.error || "Something went wrong.");
      }
      const p = (await res.json()) as BusinessPlan;
      setPlan(p);
      setThemeIdx(p.themes.length > 1 ? Math.floor(Math.random() * p.themes.length) : 0);
      setPhase(p.available ? "building" : "beta");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  // Reveal the work events one at a time on the EcomAI side.
  useEffect(() => {
    if (phase !== "building" || !plan) return;
    const total = events.length;
    if (reduce) {
      const t = setTimeout(() => {
        setStep(total);
        setFrameLoading(true); // gate preview until the theme iframe loads
        setPhase("ready");
        setChatOpen(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, total)), EVENT_MS);
    return () => clearInterval(tick);
  }, [phase, plan, events.length, reduce]);

  // When every event is narrated, reveal the finished website on the right.
  useEffect(() => {
    if (phase === "building" && events.length && step >= events.length) {
      const t = setTimeout(() => {
        setFrameLoading(true); // gate preview until the theme iframe loads
        setPhase("ready");
        setChatOpen(false); // collapse chat → full-page store preview
      }, 450);
      return () => clearTimeout(t);
    }
  }, [step, phase, events.length]);

  function reset() {
    setPhase("idle");
    setPlan(null);
    setStep(0);
    setIdea("");
    setErr(null);
    setLaunching(false);
    setChatOpen(true); // re-open the chat, ready for a new business idea
  }

  function changeConcept() {
    if (!plan || plan.themes.length < 2) return;
    setSwapping(true);
    setFrameLoading(true); // new concept → new theme iframe; show loader until it paints
    setThemeIdx((i) => (i + 1) % plan.themes.length);
    window.setTimeout(() => setSwapping(false), 650);
  }

  const currentTheme = plan?.themes[themeIdx];

  return (
    <section id="builder" className="bg-ink-50/40 pb-16 sm:pb-20">
      <div className="container-px pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="AI Website Builder"
          title="Watch EcomAI building your Online Business Foundations"
          description="Tell EcomAI what you want to sell. It finds suppliers, picks products, writes your copy, and hands you a finished storefront — all in seconds."
        />
      </div>

      {/* Full-page builder — 30% EcomAI chat · 70% preview, chat collapsible. */}
      <div className="container-px mt-10">
        <div className="flex h-[86vh] min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl shadow-ink-950/5 lg:flex-row">
          {/* ========================================================== */}
          {/*  LEFT — EcomAI chat + all the work & results (30%)          */}
          {/* ========================================================== */}
          <div
            className={cn(
              "relative flex min-h-0 flex-col overflow-hidden border-ink-100 transition-all duration-300 ease-out",
              chatOpen
                ? "h-[48%] border-b lg:h-full lg:w-[30%] lg:min-w-[300px] lg:border-b-0 lg:border-r"
                : "h-0 border-0 lg:h-full lg:w-0",
            )}
          >
          {/* header */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-100 bg-ink-50 px-5">
            <AiAvatar size={32} online />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold text-ink-950">EcomAI Builder</p>
              <p className="text-[11px] text-ink-400">
                {busy ? "Working on your store…" : "Describe your store — watch it build"}
              </p>
            </div>
            {busy && <Loader2 className="ml-auto h-4 w-4 animate-spin text-ai-500" />}
          </div>

          {/* work log / conversation */}
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {phase === "idle" && (
              <div className="grid h-full place-items-center py-8 text-center">
                <div className="max-w-xs">
                  <AiAvatar size={44} online />
                  <p className="mt-4 text-sm text-ink-500">
                    Hi — I&apos;m EcomAI. Tell me what you want to sell and I&apos;ll build your store while you watch.
                  </p>
                </div>
              </div>
            )}

            {phase === "beta" && (
              <BetaMessage
                idea={idea}
                onPick={(label) => build(label)}
                available={available.map((n) => ({ slug: n.slug, label: n.label, emoji: n.emoji }))}
              />
            )}

            {(busy || phase === "ready") && plan && (
              <>
                {/* user's idea */}
                <div className="flex justify-end">
                  <span className="rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2 text-sm text-white shadow">
                    {idea}
                  </span>
                </div>

                {/* thinking beat */}
                {phase === "thinking" && (
                  <EventRow avatar>
                    <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                      <Loader2 className="h-4 w-4 animate-spin text-ai-500" /> Analyzing your idea…
                    </span>
                  </EventRow>
                )}

                {/* revealed events */}
                {events.map((ev, i) => {
                  const done = i < step;
                  const active = i === step && phase === "building";
                  if (!done && !active) return null;
                  return (
                    <EventRow key={ev.key} avatar>
                      <div className="w-full">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink-800">
                          {done ? (
                            <Check className="h-4 w-4 shrink-0 text-brand-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ai-500" />
                          )}
                          {done ? ev.done : ev.doing + "…"}
                        </p>
                        {done && <EventResult ev={ev} reduce={!!reduce} />}
                      </div>
                    </EventRow>
                  );
                })}
              </>
            )}

            {err && <p className="text-xs text-red-500">{err}</p>}
          </div>

          {/* prompt bar (always visible) */}
          <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                build(idea);
              }}
              className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-2 transition-colors focus-within:border-ai-400"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-ai-500" />
              <input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. a grocery store, a shoe brand…"
                aria-label="What do you want to sell?"
                disabled={busy}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy}
                aria-label="Build my business"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ai-500 text-white transition hover:bg-ai-600 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </form>
            {phase === "idle" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[11px] font-medium text-ink-400">Try:</span>
                {available.slice(0, 6).map((n) => (
                  <button
                    key={n.slug}
                    onClick={() => build(n.label)}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-600 transition hover:border-ai-400/50 hover:text-ink-950"
                  >
                    {n.emoji} {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  RIGHT — preview panel (no loading here; Launch lives here)   */}
        {/* ============================================================ */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-ink-50/40">
          {/* browser chrome */}
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-ink-100 bg-ink-50 px-4">
            {phase === "ready" ? (
              <button
                onClick={reset}
                aria-label="Start a new business idea"
                title="Reset — start a new business idea"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 transition hover:border-ai-400/50 hover:text-ink-950"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New idea</span>
              </button>
            ) : (
              <button
                onClick={() => setChatOpen((o) => !o)}
                aria-label={chatOpen ? "Hide EcomAI chat" : "Show EcomAI chat"}
                title={chatOpen ? "Hide EcomAI — view store full-screen" : "Show EcomAI chat"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 transition hover:border-ai-400/50 hover:text-ink-950"
              >
                {chatOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{chatOpen ? "Hide chat" : "EcomAI"}</span>
              </button>
            )}
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
            </span>
            <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-ink-400">
              <Lock className="h-3 w-3" />
              {plan?.storeSlug ? `${plan.storeSlug}.ecomstrait.store` : "your-store.ecomstrait.store"}
            </span>
          </div>

          {/* viewport */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <AnimatePresence mode="wait">
              {phase === "ready" && currentTheme ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <iframe
                    key={currentTheme}
                    src={`/api/theme/${currentTheme}/index.html`}
                    title={`${plan?.niche} store preview`}
                    loading="eager"
                    onLoad={() => setFrameLoading(false)}
                    className="h-full w-full"
                  />

                  {/* Loader over the preview until the theme finishes loading
                      from Supabase (first paint) or a concept swap re-fetches. */}
                  <AnimatePresence>
                    {(frameLoading || swapping) && (
                      <motion.div
                        key="frame-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-[2] grid place-items-center bg-white"
                      >
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className="relative grid h-12 w-12 place-items-center">
                            <span className="absolute inset-0 animate-ping rounded-full bg-ai-500/20" />
                            <Loader2 className="h-6 w-6 animate-spin text-ai-500" />
                          </span>
                          <p className="text-sm font-medium text-ink-700">
                            {swapping ? "Loading new concept…" : "Loading your store preview…"}
                          </p>
                          {plan?.niche && (
                            <p className="text-[11px] text-ink-400">
                              Fetching your {plan.niche.toLowerCase()} storefront
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Launch overlay (waitlist form) */}
                  <AnimatePresence>
                    {launching && (
                      <motion.div
                        key="launch"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 grid place-items-center bg-ink-950/80 p-6 backdrop-blur-sm"
                      >
                        <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6 text-center text-white shadow-2xl">
                          <button
                            onClick={() => setLaunching(false)}
                            aria-label="Close"
                            className="absolute right-3 top-3 text-ink-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-ai-500 to-ai-700 shadow-lg">
                            <Rocket className="h-5 w-5" />
                          </div>
                          <h4 className="mt-3 text-lg font-bold">Launch your {plan?.niche.toLowerCase()} store</h4>
                          <p className="mt-1 text-sm text-ink-300">
                            EcomAI is rolling out in beta. Join the Founders Waitlist and we&apos;ll launch this store with you.
                          </p>
                          <div className="mt-4 flex justify-center">
                            <WaitlistForm
                              invert
                              source="ai-builder-launch"
                              idea={idea}
                              niche={plan?.niche}
                              persona="entrepreneur"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 grid place-items-center p-8 text-center"
                >
                  <div className="max-w-xs">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
                      <Store className="h-7 w-7" />
                    </span>
                    <p className="mt-4 text-sm text-ink-500">
                      {busy
                        ? "EcomAI is assembling your storefront — follow the work on the left. Your finished site lands here."
                        : "Your generated storefront will appear here once EcomAI finishes building."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* action bar — Launch lives inside the preview builder */}
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-white px-4 py-3">
            {phase === "ready" && plan && currentTheme ? (
              <>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  {plan.themes.length > 1 ? (
                    <button onClick={changeConcept} className="inline-flex items-center gap-1.5 font-semibold text-ai-600 hover:underline">
                      <Sparkles className="h-3.5 w-3.5" /> Change concept
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-ai-500" /> Live preview
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    track("build_clicked", { niche: plan?.niche ?? "", source: "ai-builder" });
                    setLaunching(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105"
                >
                  <Rocket className="h-4 w-4" /> Launch this store
                </button>
              </>
            ) : (
              <span className="text-[11px] text-ink-400">
                {plan?.disclaimer ?? "Simulated preview — example figures, not live data."}
              </span>
            )}
          </div>
          </div>
        </div>
      </div>

      {plan && phase === "ready" && (
        <div className="container-px py-4">
          <p className="text-center text-[11px] text-ink-400">{plan.disclaimer}</p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function EventRow({ children, avatar }: { children: React.ReactNode; avatar?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-2.5"
    >
      {avatar && <AiAvatar size={26} />}
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-ink-100 bg-ink-50/70 px-3.5 py-2.5">
        {children}
      </div>
    </motion.div>
  );
}

function EventResult({ ev, reduce }: { ev: BuildEvent; reduce: boolean }) {
  if (ev.kind === "suppliers") {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" /> {ev.suppliers} verified
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          ★ {ev.rating} avg rating
        </span>
      </div>
    );
  }
  if (ev.kind === "products") {
    return (
      <ul className="mt-2 space-y-1.5">
        {ev.products.map((p, i) => (
          <motion.li
            key={p.name}
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.08 }}
            className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-1.5 text-xs"
          >
            <span className="truncate text-ink-800">{p.name}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-700">
              <TrendingUp className="h-3 w-3" /> {p.margin}% margin
            </span>
          </motion.li>
        ))}
      </ul>
    );
  }
  if (ev.kind === "keywords") {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ev.keywords.map((k) => (
          <span key={k} className="rounded-full border border-ai-200 bg-ai-50 px-2.5 py-0.5 text-[11px] font-medium text-ai-700">
            {k}
          </span>
        ))}
      </div>
    );
  }
  if (ev.kind === "checklist") {
    return (
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {ev.items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
            <Check className="h-3 w-3 text-brand-500" /> {it}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Beta / coming-soon message + missing-niche capture                 */
/* ------------------------------------------------------------------ */

function BetaMessage({
  idea,
  available,
  onPick,
}: {
  idea: string;
  available: { slug: string; label: string; emoji: string }[];
  onPick: (label: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/missing-niche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, niche: idea }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-start gap-3">
        <AiAvatar size={30} />
        <div className="rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
          Sorry — <span className="font-semibold text-ink-950">“{idea}”</span> isn&apos;t in the beta builder yet.
          When EcomAI goes live it&apos;ll build <span className="font-semibold text-ink-950">any</span> niche you name.
          For now, try one of these live examples:
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 pl-11">
        {available.map((n) => (
          <button
            key={n.slug}
            onClick={() => onPick(n.label)}
            className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ai-400/50 hover:text-ink-950"
          >
            {n.emoji} {n.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
        {status === "done" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
            <Check className="h-4 w-4" /> Done — we&apos;ll email you the moment {`“${idea}”`} is live.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium text-ink-800">Want <span className="text-ink-950">“{idea}”</span> the moment it&apos;s ready?</p>
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email for niche waitlist"
                className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-3.5 text-sm outline-none focus:border-ai-400"
              />
              <Button type="submit" variant="ai" size="md" disabled={status === "loading"}>
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify me"}
              </Button>
            </form>
            {status === "error" && <p className="mt-2 text-xs text-red-500">Something went wrong. Please try again.</p>}
          </>
        )}
      </div>
    </div>
  );
}
