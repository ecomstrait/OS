"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Rocket, Store, Boxes, Users, ArrowUp, ArrowRight, ArrowLeft, Loader2,
  TrendingUp, Globe, Sparkles, RotateCcw, Target,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/shared/waitlist-form";
import { supplierSignupUrl, merchantSignupUrl } from "@/lib/site";
import { track } from "@/lib/analytics";
import { AiAvatar } from "@/components/ecomai/ai-avatar";
import type { BusinessPlan } from "@/lib/ecomai";

type Persona = {
  id: string;
  label: string;
  sub: string;
  icon: typeof Rocket;
  sellQ: string;
  supplier?: boolean;
};

const PERSONAS: Persona[] = [
  { id: "entrepreneur", label: "Entrepreneur", sub: "I want to start a business", icon: Rocket, sellQ: "What would you like to sell?" },
  { id: "store-owner", label: "Store Owner", sub: "I already sell online", icon: Store, sellQ: "What do you sell?" },
  { id: "supplier", label: "Supplier", sub: "I supply products", icon: Boxes, sellQ: "What do you supply?", supplier: true },
  { id: "agency", label: "Agency", sub: "I build stores for clients", icon: Users, sellQ: "What do your clients sell?" },
];

const SELL_CHIPS = ["Fashion", "Grocery", "Cosmetics", "Watches", "Shoes", "Jewelry"];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "United Arab Emirates"];
const BUDGETS: Record<string, number> = { "Under $500": 500, "$500–$2k": 1200, "$2k–$5k": 3500, "$5k+": 7000 };
// Suppliers estimate on monthly order volume instead of a starting budget.
const ORDERS: Record<string, number> = { "Up to 100": 100, "100–500": 300, "500–2,000": 1200, "2,000+": 3000 };
// Illustrative average wholesale value per order (labeled example).
const SUPPLIER_AOV = 30;

type Step = "persona" | "sell" | "country" | "budget" | "analyzing" | "result";
const EASE = [0.22, 1, 0.36, 1] as const;

function currency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function AiSimulator() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("persona");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [sell, setSell] = useState("");
  const [country, setCountry] = useState("");
  const [budget, setBudget] = useState("");
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function analyze(finalBudget: string) {
    track("idea_submitted", {
      idea: sell,
      source: "ai-simulator",
      persona: persona?.id ?? "",
    });
    setStep("analyzing");
    setErr(null);
    try {
      const res = await fetch("/api/ecomai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: sell, country, budget: finalBudget }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Something went wrong.");
      setPlan((await res.json()) as BusinessPlan);
      setStep("result");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep("budget");
    }
  }

  function restart() {
    setStep("persona");
    setPersona(null);
    setSell("");
    setCountry("");
    setBudget("");
    setPlan(null);
    setErr(null);
  }

  const stepIndex = ["persona", "sell", "country", "budget"].indexOf(step);

  return (
    <Section tone="gradient" id="simulator">
      <SectionHeading
        invert
        eyebrow="AI Business Simulator"
        title="Model your future business in 30 seconds"
        description="Answer three questions and EcomAI estimates your margins, revenue, and the exact store it would build for you."
      />

      <div className="mx-auto mt-12 max-w-3xl">
        <div className="glass-dark overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
            <AiAvatar size={38} online />
            <div>
              <p className="text-sm font-bold text-white">EcomAI Simulator</p>
              <p className="text-[11px] text-white/50">Simulated preview · example figures</p>
            </div>
            {step !== "persona" && step !== "result" && (
              <div className="ml-auto flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i <= stepIndex ? "#3b82f6" : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
            )}
          </div>

          <div className="min-h-[360px] p-5 sm:p-8">
            <AnimatePresence mode="wait">
              {/* ---- Persona ---- */}
              {step === "persona" && (
                <Panel key="persona">
                  <Prompt>Hi 👋 I&apos;m EcomAI. <span className="font-semibold text-white">Who are you today?</span></Prompt>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setPersona(p); setStep("sell"); }}
                        className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-4 text-left transition-colors hover:border-ai-400/60 hover:bg-white/10"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ai-500/20 text-ai-300">
                          <p.icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-white">{p.label}</span>
                          <span className="block text-[11px] text-white/50">{p.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Panel>
              )}

              {/* ---- Sell ---- */}
              {step === "sell" && persona && (
                <Panel key="sell">
                  <Prompt>{persona.sellQ}</Prompt>
                  <QuestionInput
                    value={sell}
                    onChange={setSell}
                    placeholder="e.g. luxury watches, skincare, coffee…"
                    onSubmit={() => sell.trim().length > 1 && setStep("country")}
                    chips={SELL_CHIPS}
                    onChip={(c) => { setSell(c); setStep("country"); }}
                  />
                  <BackBtn onClick={() => setStep("persona")} />
                </Panel>
              )}

              {/* ---- Country ---- */}
              {step === "country" && (
                <Panel key="country">
                  <Prompt>
                    {persona?.supplier
                      ? "Which markets do you want to reach?"
                      : "Which country are you targeting?"}
                  </Prompt>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {COUNTRIES.map((c) => (
                      <Chip key={c} onClick={() => { setCountry(c); setStep("budget"); }}>{c}</Chip>
                    ))}
                    <Chip onClick={() => { setCountry("Global"); setStep("budget"); }}>🌍 Global</Chip>
                  </div>
                  <BackBtn onClick={() => setStep("sell")} />
                </Panel>
              )}

              {/* ---- Budget (or, for suppliers, monthly orders) ---- */}
              {step === "budget" && (
                <Panel key="budget">
                  <Prompt>
                    {persona?.supplier
                      ? "What are your monthly order expectations?"
                      : "What's your monthly budget to start?"}
                  </Prompt>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.keys(persona?.supplier ? ORDERS : BUDGETS).map((b) => (
                      <Chip key={b} onClick={() => { setBudget(b); analyze(b); }}>
                        {persona?.supplier ? `${b} orders` : b}
                      </Chip>
                    ))}
                  </div>
                  {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
                  <BackBtn onClick={() => setStep("country")} />
                </Panel>
              )}

              {/* ---- Analyzing ---- */}
              {step === "analyzing" && (
                <Panel key="analyzing">
                  <div className="grid min-h-[280px] place-items-center">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AiAvatar size={44} />
                      <span className="flex items-center gap-2 text-sm text-white/70">
                        <Loader2 className="h-4 w-4 animate-spin text-ai-400" /> Analyzing suppliers, margins & demand…
                      </span>
                    </div>
                  </div>
                </Panel>
              )}

              {/* ---- Result ---- */}
              {step === "result" && plan && (
                <Panel key="result">
                  <Result
                    plan={plan}
                    persona={persona}
                    amount={persona?.supplier ? (ORDERS[budget] ?? 300) : (BUDGETS[budget] ?? 1200)}
                    reduce={!!reduce}
                    onRestart={restart}
                  />
                </Panel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <AiAvatar size={28} />
      <div className="rounded-2xl rounded-tl-sm bg-white/8 px-4 py-2.5 text-[14px] leading-relaxed text-white/85">{children}</div>
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-ai-400/50 hover:text-white">
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  );
}

function QuestionInput({
  value, onChange, placeholder, onSubmit, chips, onChip,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  onSubmit: () => void; chips: string[]; onChip: (c: string) => void;
}) {
  return (
    <div className="mt-4">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-ink-950/60 px-3 py-2 focus-within:border-ai-400">
        <Sparkles className="h-4 w-4 shrink-0 text-ai-400" />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
        <button type="submit" aria-label="Continue" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ai-500 text-white transition hover:bg-ai-600">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button key={c} onClick={() => onChip(c)} className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-ai-400/40 hover:text-white">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result dashboard (merged ROI simulator)                           */
/* ------------------------------------------------------------------ */

function Result({
  plan, persona, amount, reduce, onRestart,
}: {
  plan: BusinessPlan; persona: Persona | null; amount: number; reduce: boolean; onRestart: () => void;
}) {
  const isSupplier = !!persona?.supplier;

  const view = useMemo(() => {
    const marginMid = (plan.estimate.margin[0] + plan.estimate.margin[1]) / 200; // fraction
    const niche = plan.niche.toLowerCase();

    // ---- Supplier: sales & profit driven by monthly order volume ----
    if (isSupplier) {
      const orders = amount;
      const sales = orders * SUPPLIER_AOV; // monthly wholesale sales
      const profit = sales * marginMid;
      const data = Array.from({ length: 12 }, (_, i) => {
        const g = 1 + i * 0.06;
        return { month: `M${i + 1}`, revenue: Math.round(sales * g), profit: Math.round(profit * g) };
      });
      return {
        headline: `Great — ${niche} suppliers are in demand. Here's what ${orders.toLocaleString()} orders a month could look like.`,
        tiles: [
          { icon: Boxes, label: "Monthly orders", value: orders.toLocaleString() },
          { icon: TrendingUp, label: "Avg. margin", value: plan.marginRange },
          { icon: Store, label: "Est. sales", value: `${currency(sales)}/mo` },
          { icon: Target, label: "Est. profit", value: `${currency(profit)}/mo` },
        ],
        data,
        revLabel: "Sales",
        meta: [
          { icon: Boxes, text: `${currency(SUPPLIER_AOV)} avg. order value` },
          { icon: Globe, text: plan.targetCountries.join(" · ") },
        ],
      };
    }

    // ---- Store owner / entrepreneur / agency: revenue & break-even ----
    const revenueMid = (plan.estimate.revenue[0] + plan.estimate.revenue[1]) / 2;
    const profit = revenueMid * marginMid;
    const breakEven = profit > 0 ? amount / profit : 0;
    const data = Array.from({ length: 12 }, (_, i) => {
      const g = 1 + i * 0.08;
      return { month: `M${i + 1}`, revenue: Math.round(revenueMid * g), profit: Math.round(profit * g) };
    });
    return {
      headline: plan.headline,
      tiles: [
        { icon: Target, label: "Best niche", value: plan.niche },
        { icon: TrendingUp, label: "Avg. margin", value: plan.marginRange },
        { icon: Store, label: "Est. revenue", value: `${currency(revenueMid)}/mo` },
        { icon: Boxes, label: "Break-even", value: `${breakEven.toFixed(1)} mo` },
      ],
      data,
      revLabel: "Revenue",
      meta: [
        { icon: Boxes, text: plan.supplierRange },
        { icon: Globe, text: plan.targetCountries.join(" · ") },
      ],
    };
  }, [plan, amount, isSupplier]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5">
        <AiAvatar size={28} />
        <div className="rounded-2xl rounded-tl-sm bg-white/8 px-4 py-2.5 text-[14px] leading-relaxed text-white/85">
          {view.headline}
        </div>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {view.tiles.map((s, i) => (
          <motion.div key={s.label} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <s.icon className="h-4 w-4 text-ai-400" />
            <p className="mt-2 truncate text-sm font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/45">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* projection chart */}
      <div className="rounded-2xl border border-white/10 bg-ink-950/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-white/70">12-month projection</p>
          <div className="flex items-center gap-3 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> {view.revLabel}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ai-500" /> Profit</span>
          </div>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={view.data} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sim-rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                <linearGradient id="sim-profit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v) => currency(Number(v))} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#sim-rev)" isAnimationActive={!reduce} />
              <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fill="url(#sim-profit)" isAnimationActive={!reduce} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
        {view.meta.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <m.icon className={`h-3.5 w-3.5 ${i === 0 ? "text-brand-400" : "text-ai-400"}`} /> {m.text}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">
          {isSupplier ? "Ready to reach thousands of stores?" : "Shall I build your store?"}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          {isSupplier ? (
            <Button href={supplierSignupUrl} variant="primary" size="md">Become a Supplier <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button
              href={merchantSignupUrl}
              variant="ai"
              size="md"
              onClick={() => track("build_clicked", { niche: plan.niche, source: "ai-simulator" })}
            >
              Build my business <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <WaitlistForm
              invert
              source="ai-simulator"
              idea={plan.idea}
              niche={plan.niche}
              persona={persona?.id}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35">{plan.disclaimer}</p>
        <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5" /> Start over
        </button>
      </div>
    </div>
  );
}
