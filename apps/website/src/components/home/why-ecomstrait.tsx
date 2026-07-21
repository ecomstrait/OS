"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X, Zap, Trophy } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const highlights = [
  "AI-first, not AI as an afterthought",
  "One platform replaces ten tools",
  "Verified, ready-to-sell suppliers",
  "Live desktop & mobile preview",
  "Built-in AI business consultant",
  "White-label ready for agencies",
];

const comparison = [
  { task: "Find suppliers", traditional: "Weeks", ecom: "Minutes" },
  { task: "Build website", traditional: "Weeks", ecom: "Hours" },
  { task: "Product descriptions", traditional: "Manual", ecom: "AI generated" },
  { task: "SEO", traditional: "Manual", ecom: "Automated" },
  { task: "Analytics & AI advisor", traditional: "Not included", ecom: "Included" },
];

/** How far the slow "Traditional" bar limps — partial + varied per row. */
const TRAD_FILL = [24, 30, 22, 34, 16];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WhyEcomStrait() {
  return (
    <Section tone="light" id="why">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* ---- Left column: heading + highlights ---- */}
        <div>
          <SectionHeading
            align="left"
            eyebrow="Why EcomStrait"
            title={<>More than a marketplace. More than a website builder.</>}
            description="Most tools hand you one piece and leave the rest to you. EcomAI is a co-founder that builds your store, finds suppliers, writes your marketing, and grows your business — from a single prompt."
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <Reveal as="li" key={h} delay={i * 0.4} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-sm shadow-brand-500/40">
                  <DrawCheck delay={0.15 + i * 0.1} />
                </span>
                <span className="text-[15px] font-medium text-ink-700">{h}</span>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8">
            <Button href="/why-ecomstrait" variant="primary" size="md">
              Read the full comparison <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ---- Right column: the live scoreboard ---- */}
        <ScoreboardCard />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  A check mark that draws itself in on scroll                        */
/* ------------------------------------------------------------------ */

function DrawCheck({ delay = 0 }: { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: false, margin: "-60px" }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, delay, ease: EASE }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Live "race" scoreboard                                             */
/* ------------------------------------------------------------------ */

function ScoreboardCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });
  const reduce = useReducedMotion();

  const total = comparison.length;
  const [runKey, setRunKey] = useState(0);
  const [wins, setWins] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Count the winner tally up once the card is in view (and on every replay).
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const t = setTimeout(() => setWins(total), 0);
      return () => clearTimeout(t);
    }
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setWins(n);
      if (n >= total) clearInterval(iv);
    }, 280);
    return () => clearInterval(iv);
  }, [inView, reduce, total, runKey]);

  const replay = () => {
    setWins(0);
    setRunKey((k) => k + 1);
  };

  const started = inView || reduce;

  return (
    <Reveal>
      <div
        ref={ref}
        className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-950/5"
      >
        {/* ---- Card header: title + live badge + replay ---- */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/70 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-brand-500"
                  animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <span className="relative h-2.5 w-2.5 rounded-full bg-brand-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-500">
              Live comparison
            </span>
          </div>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay the comparison animation"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <Zap className="h-3.5 w-3.5" />
            Replay
          </button>
        </div>

        {/* ---- Column headers ---- */}
        <div className="grid grid-cols-[1.15fr_1fr_1fr] border-b border-ink-100 bg-white text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span className="px-4 py-3">Task</span>
          <span className="px-4 py-3 text-center">Traditional</span>
          <span className="relative overflow-hidden px-4 py-3 text-center text-brand-700">
            <span className="relative z-10">EcomStrait</span>
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  background:
                    "linear-gradient(100deg, transparent 25%, rgba(16,185,129,0.28) 50%, transparent 75%)",
                }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              />
            )}
          </span>
        </div>

        {/* ---- Rows ---- */}
        {comparison.map((row, i) => {
          const active = hovered === i;
          const won = i < wins;
          return (
            <motion.div
              key={row.task}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={started ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: EASE }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "grid grid-cols-[1.15fr_1fr_1fr] items-center border-b border-ink-100 transition-colors duration-200 last:border-0",
                active && "bg-brand-50/40",
              )}
              style={active ? { boxShadow: "inset 3px 0 0 0 #10b981" } : undefined}
            >
              {/* Task */}
              <span className="px-4 py-3.5 text-sm font-medium text-ink-800">{row.task}</span>

              {/* Traditional — slow, red, partial */}
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-center gap-1.5 text-[13px] text-ink-400">
                  <X className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                  <span>{row.traditional}</span>
                </div>
                <div className="mx-auto mt-2 h-1.5 w-full max-w-[7rem] overflow-hidden rounded-full bg-ink-100">
                  <motion.div
                    key={`trad-${runKey}`}
                    className="h-full rounded-full bg-gradient-to-r from-red-300 to-red-400"
                    initial={{ width: 0 }}
                    animate={started ? { width: `${TRAD_FILL[i]}%` } : { width: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 2, delay: 0.25 + i * 0.12, ease: EASE }
                    }
                  />
                </div>
              </div>

              {/* EcomStrait — fast, emerald, full + glow */}
              <div
                className={cn(
                  "relative px-4 py-3.5 transition-colors duration-200",
                  active ? "bg-brand-50/70" : "bg-brand-50/40",
                )}
              >
                <div className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand-700">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{row.ecom}</span>
                </div>
                <div className="relative mx-auto mt-2 h-1.5 w-full max-w-[7rem] overflow-hidden rounded-full bg-brand-100">
                  <motion.div
                    key={`ecom-${runKey}`}
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    initial={{ width: 0 }}
                    animate={started ? { width: "100%" } : { width: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.7, delay: 0.25 + i * 0.12, ease: EASE }
                    }
                  />
                  {/* continuous shimmer on the full bar signals "live" */}
                  {!reduce && (
                    <motion.div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.65) 50%, transparent 70%)",
                      }}
                      animate={{ x: ["-100%", "180%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1 + i * 0.12,
                        repeatDelay: 1.6,
                      }}
                    />
                  )}
                </div>
                {/* winner glow pip that lights as the tally reaches this row */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-500"
                  initial={false}
                  animate={
                    won
                      ? { opacity: 1, scale: 1, boxShadow: "0 0 10px 2px rgba(16,185,129,0.7)" }
                      : { opacity: 0, scale: 0.4, boxShadow: "0 0 0 0 rgba(16,185,129,0)" }
                  }
                  transition={{ duration: 0.35, ease: EASE }}
                />
              </div>
            </motion.div>
          );
        })}

        {/* ---- Footer: animated winner tally ---- */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <span className="flex items-center gap-2 text-sm text-ink-600">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/40">
              <Trophy className="h-4 w-4" />
            </span>
            EcomStrait wins
          </span>
          <span className="flex items-baseline gap-1 font-display font-bold text-ink-900">
            <motion.span
              key={wins}
              initial={reduce ? false : { y: 6, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="text-2xl text-brand-600"
            >
              {wins}
            </motion.span>
            <span className="text-sm text-ink-400">/ {total}</span>
          </span>
        </div>
      </div>
    </Reveal>
  );
}
