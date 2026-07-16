"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence, motion, useInView, useReducedMotion,
} from "framer-motion";
import { ArrowRight, ArrowUp, Boxes, Store, Check, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

type AudienceKey = "supplier" | "store";

const AUDIENCES: Record<
  AudienceKey,
  {
    tone: "brand" | "ai";
    icon: typeof Boxes;
    reply: string;
    aiLine: string;
    eyebrow: string;
    title: string;
    benefits: string[];
    cta: { label: string; href: string };
  }
> = {
  supplier: {
    tone: "brand",
    icon: Boxes,
    reply: "I'm a Supplier",
    aiLine: "Love it — I'll turn your inventory into orders on autopilot.",
    eyebrow: "For Suppliers",
    title: "Grow your wholesale business",
    benefits: [
      "Publish your products once",
      "Manage inventory centrally",
      "Receive automated orders",
      "Real-time sales analytics",
      "Reach thousands of retailers",
    ],
    cta: { label: "Become a Supplier", href: "/suppliers" },
  },
  store: {
    tone: "ai",
    icon: Store,
    reply: "I'm a Store Owner",
    aiLine: "Perfect — I'll build, manage, and run your store for you.",
    eyebrow: "For Store Owners",
    title: "Launch your store with AI",
    benefits: [
      "AI-built, on-brand website",
      "Live desktop & mobile preview",
      "Ready-to-sell products",
      "No inventory to hold",
      "Start selling in hours",
    ],
    cta: { label: "Launch My Store", href: "/store-owners" },
  },
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function DualAudience() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState(0); // 0 greeting · 1 typing · 2 question+choices
  const [selected, setSelected] = useState<AudienceKey | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const t = setTimeout(() => setPhase(2), 0);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase(1), 750);
    const t2 = setTimeout(() => setPhase(2), 1850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, reduce]);

  const active = selected ? AUDIENCES[selected] : null;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink-50 py-20 sm:py-28"
    >
      {/* ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.28), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.28), transparent 65%)" }}
      />

      <div className="container-px relative">
        <SectionHeading
          eyebrow="One Platform. Endless Opportunities."
          title="Not sure where you fit? Just ask EcomAI."
          description="Tell EcomAI which side you're on, and it maps out exactly how it will help you grow — instantly."
        />

        <div className="mx-auto mt-14 grid max-w-6xl items-stretch gap-6 lg:grid-cols-[1fr_1fr]">
          {/* ---- Chat card ---- */}
          <ChatCard
            phase={phase}
            inView={inView}
            reduce={!!reduce}
            selected={selected}
            onChoose={(k) => setSelected(k)}
          />

          {/* ---- Offering card (empty until a side is picked) ---- */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {active ? (
                <OfferingCard key={selected} audience={active} reduce={!!reduce} />
              ) : (
                <WaitingCard key="waiting" reduce={!!reduce} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  EcomAI chat                                                        */
/* ------------------------------------------------------------------ */

function ChatCard({
  phase,
  inView,
  reduce,
  selected,
  onChoose,
}: {
  phase: number;
  inView: boolean;
  reduce: boolean;
  selected: AudienceKey | null;
  onChoose: (k: AudienceKey) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onChoose(/suppl|wholesale|vendor|inventory/i.test(text) ? "supplier" : "store");
    setDraft("");
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-950/5">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-50/60 px-5 py-4">
        <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ai-500 to-ai-700 text-white shadow-lg shadow-ai-500/30">
          <Sparkles className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink-950">EcomAI</p>
          <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Online · replies instantly
          </p>
        </div>
      </div>

      {/* messages */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Bubble show={inView} reduce={reduce}>
          Hi 👋 I&apos;m <span className="font-semibold text-ink-950">EcomAI</span> — your always-on commerce partner.
        </Bubble>

        <AnimatePresence mode="wait">
          {phase === 1 && <TypingBubble key="typing" />}
          {phase >= 2 && (
            <Bubble key="q" show reduce={reduce}>
              Tell me — <span className="font-semibold text-ink-950">which side are you on?</span>
            </Bubble>
          )}
        </AnimatePresence>

        {/* choice chips */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-wrap gap-2.5 pt-1"
            >
              {(Object.keys(AUDIENCES) as AudienceKey[]).map((k) => {
                const a = AUDIENCES[k];
                const isActive = selected === k;
                const isBrand = a.tone === "brand";
                return (
                  <button
                    key={k}
                    onClick={() => onChoose(k)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? isBrand
                          ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                          : "border-ai-500 bg-ai-500 text-white shadow-lg shadow-ai-500/25"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50"
                    }`}
                  >
                    <a.icon className="h-4 w-4" />
                    {a.reply}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* user reply + AI answer once a side is picked */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <UserBubble reduce={reduce}>{AUDIENCES[selected].reply}</UserBubble>
              <Bubble show reduce={reduce} delay={0.25}>
                {AUDIENCES[selected].aiLine}{" "}
                <span className="text-ink-400">Here&apos;s your plan →</span>
              </Bubble>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* input bar — fills the card and invites the visitor to chat */}
      <div className="border-t border-ink-100 bg-ink-50/40 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-2 transition-colors focus-within:border-ai-400"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-ai-500" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask EcomAI anything…"
            aria-label="Ask EcomAI"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink-950 text-white transition hover:bg-ink-800"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({
  children,
  show,
  reduce,
  delay = 0,
}: {
  children: React.ReactNode;
  show: boolean;
  reduce: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="flex items-start gap-2.5"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ai-50 text-ai-600">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-2.5 text-[14px] leading-relaxed text-ink-600">
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12, x: 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink-950 px-4 py-2.5 text-[14px] font-medium text-white">
        {children}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2.5"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ai-50 text-ai-600">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-300"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Waiting state — shown until the visitor picks a side               */
/* ------------------------------------------------------------------ */

function WaitingCard({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center shadow-xl shadow-ink-950/5"
    >
      {/* pulsing EcomAI orb */}
      <div className="relative grid h-24 w-24 place-items-center">
        {!reduce && (
          <>
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-ai-400/40"
            />
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-3 rounded-full border border-ai-300"
            />
          </>
        )}
        <motion.div
          animate={reduce ? {} : { scale: [1, 1.05, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-ai-500 to-ai-700 text-white shadow-lg shadow-ai-500/40"
        >
          <Sparkles className="h-7 w-7" />
        </motion.div>
      </div>

      <div className="space-y-1.5">
        <p className="font-display text-lg font-bold text-ink-950">EcomAI is ready for you</p>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-500">
          Pick a side in the chat and I&apos;ll instantly map out your personalized plan.
        </p>
      </div>

      {/* loading dots — "preparing your plan" */}
      <div className="flex items-center gap-2 text-xs font-medium text-ai-600">
        <span>Waiting for your answer</span>
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ai-500"
              animate={reduce ? {} : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </div>

      {/* shimmering skeleton of the plan being prepared */}
      <div aria-hidden className="w-full max-w-xs space-y-2.5 pt-2">
        {[
          "h-10 w-full",
          "h-3 w-3/4",
          "h-3 w-full",
          "h-3 w-5/6",
          "h-3 w-2/3",
        ].map((size, i) => (
          <div
            key={i}
            className={`rounded-lg ${size} ${i === 0 ? "mx-auto" : "mx-auto"}`}
            style={{
              background:
                "linear-gradient(90deg, var(--color-ink-100) 25%, var(--color-ink-50) 50%, var(--color-ink-100) 75%)",
              backgroundSize: "200% 100%",
              animation: reduce ? undefined : "shimmer 2s linear infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tailored offering                                                  */
/* ------------------------------------------------------------------ */

function OfferingCard({
  audience,
  reduce,
}: {
  audience: (typeof AUDIENCES)[AudienceKey];
  reduce: boolean;
}) {
  const isBrand = audience.tone === "brand";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-950/5"
    >
      {/* gradient banner */}
      <div
        className="relative overflow-hidden p-8 text-white sm:p-9"
        style={{
          background: isBrand
            ? "linear-gradient(135deg, #10b981, #047857)"
            : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
          <Sparkles className="h-3.5 w-3.5" /> EcomAI recommends
        </div>
        <span className="relative mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <audience.icon className="h-7 w-7" />
        </span>
        <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
          {audience.eyebrow}
        </p>
        <h3 className="relative mt-1.5 text-2xl font-bold sm:text-[1.75rem]">{audience.title}</h3>
      </div>

      {/* benefits */}
      <div className="flex flex-1 flex-col p-8 sm:p-9">
        <ul className="flex flex-1 flex-col gap-3.5">
          {audience.benefits.map((b, i) => (
            <motion.li
              key={b}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.09, ease: EASE }}
              className="flex items-center gap-3 text-[15px] text-ink-700"
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  isBrand ? "bg-brand-50 text-brand-600" : "bg-ai-50 text-ai-600"
                }`}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {b}
            </motion.li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href={audience.cta.href} variant={isBrand ? "primary" : "ai"} size="lg">
            {audience.cta.label} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
