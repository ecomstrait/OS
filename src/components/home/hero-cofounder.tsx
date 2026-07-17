"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUp, Check, Loader2, Sparkles, Store, TrendingUp, Boxes,
  Globe, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { AiAvatar } from "@/components/ecomai/ai-avatar";
import type { BusinessPlan } from "@/lib/ecomai";

const SUGGESTIONS = ["Perfumes", "Luxury watches", "Skincare", "Sneakers", "Home decor", "Coffee"];
const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 360;

type Phase = "idle" | "thinking" | "building" | "done";

export function HeroCofounder() {
  const reduce = useReducedMotion();
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function build(text: string) {
    const q = text.trim();
    if (q.length < 2) return;
    setIdea(q);
    setErr(null);
    setPlan(null);
    setStep(0);
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
      setPhase("building");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  // Play the build timeline, then reveal the plan.
  useEffect(() => {
    if (phase !== "building" || !plan) return;
    const total = plan.buildSteps.length;
    if (reduce) {
      const t = setTimeout(() => {
        setStep(total);
        setPhase("done");
      }, 0);
      return () => clearTimeout(t);
    }
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, total)), STEP_MS);
    const finish = setTimeout(() => setPhase("done"), total * STEP_MS + 500);
    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
  }, [phase, plan, reduce]);

  function reset() {
    setPhase("idle");
    setPlan(null);
    setStep(0);
    setIdea("");
    setErr(null);
  }

  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-25" />
      <OceanBackdrop accentHex="#3b82f6" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/3 h-[440px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5), rgba(16,185,129,0.35), transparent 70%)" }}
      />

      <div className="container-px relative py-14 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.08fr]">
          {/* ---- Copy (static, SEO-safe) ---- */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-ai-400" />
              The world&apos;s first AI Ecommerce Co-Founder
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Build your online business.{" "}
              <span className="text-gradient">AI handles everything.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
              From suppliers and websites to SEO, marketing, and growth — tell EcomAI
              what you want to build and watch your business come to life in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2"><Boxes className="h-4 w-4 text-brand-400" /> Verified suppliers</span>
              <span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-ai-400" /> Store built for you</span>
              <span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-400" /> Growth on autopilot</span>
            </div>
          </div>

          {/* ---- Conversation ---- */}
          <div className="relative">
            <div className="glass-dark overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
              {/* header */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <AiAvatar size={40} online />
                  <div>
                    <p className="text-sm font-bold text-white">EcomAI</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Online · your co-founder
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/50 sm:block">
                  Simulated preview
                </span>
              </div>

              {/* body */}
              <div className="flex min-h-[420px] flex-col gap-3 p-5">
                <AiBubble>
                  Hi 👋 I&apos;m EcomAI, your ecommerce co-founder.{" "}
                  <span className="font-semibold text-white">What do you want to sell?</span>
                </AiBubble>

                {idea && <UserBubble>{idea}</UserBubble>}

                <AnimatePresence mode="wait">
                  {phase === "thinking" && (
                    <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TypingBubble label={`Analyzing “${idea}”…`} />
                    </motion.div>
                  )}

                  {phase === "building" && plan && (
                    <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                      <AiBubble>{plan.headline}</AiBubble>
                      <BuildLog plan={plan} step={step} />
                    </motion.div>
                  )}

                  {phase === "done" && plan && (
                    <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                      <AiBubble>{plan.headline}</AiBubble>
                      <PlanResult plan={plan} onReset={reset} reduce={!!reduce} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* input (idle only) */}
                {phase === "idle" && (
                  <div className="mt-auto pt-2">
                    {err && (
                      <p className="mb-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{err}</p>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        build(idea);
                      }}
                      className="flex items-center gap-2 rounded-2xl border border-white/15 bg-ink-950/60 px-3 py-2 transition-colors focus-within:border-ai-400"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-ai-400" />
                      <input
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="e.g. luxury watches, skincare, coffee…"
                        aria-label="What do you want to sell?"
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                      />
                      <button
                        type="submit"
                        aria-label="Build my business"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ai-500 text-white transition hover:bg-ai-600"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => build(s)}
                          className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-ai-400/40 hover:text-white"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat primitives                                                    */
/* ------------------------------------------------------------------ */

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex items-start gap-2.5"
    >
      <AiAvatar size={28} />
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/8 px-4 py-2.5 text-[14px] leading-relaxed text-white/85">
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ai-500 px-4 py-2.5 text-[14px] font-medium text-white">
        {children}
      </div>
    </motion.div>
  );
}

function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <AiAvatar size={28} />
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white/8 px-4 py-3">
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/60"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
        <span className="text-xs text-white/60">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Build timeline                                                     */
/* ------------------------------------------------------------------ */

function BuildLog({ plan, step }: { plan: BusinessPlan; step: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-950/50 p-4">
      <ul className="space-y-2">
        {plan.buildSteps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.at} className="flex items-center gap-3 text-sm">
              <span className="w-10 shrink-0 font-mono text-[11px] text-white/40">{s.at}</span>
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-brand-400" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ai-400" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-white/15" />
              )}
              <span className={done || active ? "text-white/90" : "text-white/40"}>{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result                                                             */
/* ------------------------------------------------------------------ */

function PlanResult({ plan, onReset, reduce }: { plan: BusinessPlan; onReset: () => void; reduce: boolean }) {
  const stats = [
    { icon: Boxes, label: "Suppliers", value: plan.supplierRange },
    { icon: TrendingUp, label: "Avg. margin", value: plan.marginRange },
    { icon: Store, label: "Est. revenue", value: plan.monthlyRevenueRange },
  ];
  return (
    <div className="flex flex-col gap-4">
      {/* stats */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <s.icon className="h-4 w-4 text-ai-400" />
            <p className="mt-2 text-sm font-bold leading-tight text-white">{s.value}</p>
            <p className="text-[10px] text-white/45">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* product ideas */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Products to import</p>
        <div className="flex flex-wrap gap-1.5">
          {plan.productIdeas.map((p) => (
            <span key={p} className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-white/80">{p}</span>
          ))}
        </div>
      </div>

      {/* target countries */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        <Globe className="h-3.5 w-3.5 text-brand-400" />
        {plan.targetCountries.join(" · ")}
      </div>

      {/* store preview + waitlist */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Your store is ready</p>
            <p className="text-[11px] text-white/50">Conversion-optimized · mobile-ready</p>
          </div>
          {plan.storeSlug && (
            <Button href={`/store/${plan.storeSlug}`} variant="ai" size="sm">
              Preview store <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Join the founders waitlist</p>
          <NewsletterForm invert source="hero-cofounder" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35">{plan.disclaimer}</p>
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5" /> Try another idea
        </button>
      </div>
    </div>
  );
}
