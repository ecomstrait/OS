"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Store, Server, Package, Search, Megaphone, CreditCard,
  Headphones, BarChart3, Boxes, ArrowRight, Sparkles, RotateCcw,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fragmentedTools = [
  { icon: Store, label: "Website Builder" },
  { icon: Server, label: "Hosting" },
  { icon: Package, label: "Inventory" },
  { icon: Search, label: "SEO" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Boxes, label: "Suppliers" },
  { icon: CreditCard, label: "Payments" },
  { icon: Headphones, label: "Support" },
  { icon: BarChart3, label: "Analytics" },
];

const unified = [
  "Suppliers", "AI", "Website", "Analytics", "Inventory",
  "Marketing", "Payments", "Orders", "SEO", "Customers",
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/*  Deterministic layouts (index-derived — no Math.random)            */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Scattered coordinates for the fragmented "problem" stack. */
const PROBLEM_LAYOUT = [
  { left: 13, top: 18 }, { left: 41, top: 9 }, { left: 69, top: 16 },
  { left: 88, top: 34 }, { left: 21, top: 46 }, { left: 50, top: 42 },
  { left: 81, top: 62 }, { left: 15, top: 74 }, { left: 59, top: 78 },
];

/** Orbit + chaos positions for the 10 unified capabilities. */
const NODES = unified.map((label, i) => {
  const n = unified.length;
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  const rx = 41;
  const ry = 40;
  return {
    label,
    // organized orbit position
    x: 50 + rx * Math.cos(angle),
    y: 50 + ry * Math.sin(angle),
    // scattered "chaos" position, derived from index
    sx: clamp(50 + 46 * Math.cos(i * 2.3999 + 0.6), 8, 92),
    sy: clamp(50 + 42 * Math.sin(i * 1.7 + 1.2), 10, 90),
    accent: i % 2 === 0 ? ("brand" as const) : ("ai" as const),
  };
});

/* ------------------------------------------------------------------ */

export function ProblemSolution() {
  return (
    <Section tone="light">
      <style>{`
        @keyframes ps-flow { to { stroke-dashoffset: -20; } }
      `}</style>

      {/* Problem */}
      <SectionHeading
        eyebrow="The Problem"
        title="Running an ecommerce business is harder than it should be"
        description="Too many tools. Too many subscriptions. Too much manual work. Every part of your business lives in a different place — and none of them talk to each other."
      />
      <ProblemChaos />

      {/* Solution */}
      <div className="mt-24">
        <SectionHeading
          eyebrow="The Solution"
          title={<>Everything your business needs. <span className="text-gradient">One intelligent platform.</span></>}
          description="EcomStrait replaces the fragmented stack with a single system where AI, suppliers, commerce, and analytics work together."
        />
        <SolutionConstellation />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  THE PROBLEM — scattered, drifting, disconnected cards             */
/* ------------------------------------------------------------------ */

function ProblemChaos() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto mt-12 h-[360px] max-w-3xl sm:h-[420px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl bg-grid opacity-60" />
      {fragmentedTools.map((t, i) => {
        const pos = PROBLEM_LAYOUT[i];
        const floatDur = 3.4 + (i % 4) * 0.6;
        const floatDelay = (i % 5) * 0.4;
        const yAmp = 6 + (i % 3) * 3;
        const xAmp = 4 + (i % 2) * 3;
        const rot = i % 2 === 0 ? 2.5 : -3;
        return (
          <motion.div
            key={t.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            initial={reduce ? false : { opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
          >
            <motion.div
              className="group flex w-24 flex-col items-center gap-1.5 rounded-2xl border border-dashed border-ink-300 bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm sm:w-28 sm:p-4"
              animate={
                reduce
                  ? {}
                  : { y: [0, -yAmp, 0], x: [0, xAmp, 0], rotate: [-rot, rot, -rot] }
              }
              transition={{ duration: floatDur, delay: floatDelay, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.08, borderColor: "rgb(148 163 184)" }}
            >
              <t.icon className="h-5 w-5 text-ink-400 transition-colors group-hover:text-ink-600 sm:h-6 sm:w-6" />
              <span className="text-[11px] font-medium text-ink-500 sm:text-xs">{t.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE SOLUTION — converge into an organized constellation           */
/* ------------------------------------------------------------------ */

function SolutionConstellation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-120px" });
  const reduce = useReducedMotion();

  const [unifiedOn, setUnifiedOn] = useState(false);
  const [coreHover, setCoreHover] = useState(false);

  // Auto-play the convergence once when scrolled into view.
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setUnifiedOn(true), reduce ? 0 : 750);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  const active = unifiedOn || coreHover;

  return (
    <Reveal className="relative mx-auto mt-14 max-w-3xl">
      <div
        ref={ref}
        className="relative h-[460px] overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-b from-white to-ink-50 sm:h-[540px]"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

        {/* Connection lines (light up when unified / core hovered) */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {NODES.map((n, i) => {
            const hex = n.accent === "brand" ? "#10b981" : "#3b82f6";
            return (
              <g key={`line-${n.label}`}>
                <motion.line
                  x1={50}
                  y1={50}
                  x2={n.x}
                  y2={n.y}
                  stroke={hex}
                  strokeWidth={1}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={false}
                  animate={{ opacity: active ? 0.35 : 0 }}
                  transition={{ duration: 0.5, delay: active ? i * 0.05 : 0 }}
                />
                {active && !reduce && (
                  <line
                    x1={50}
                    y1={50}
                    x2={n.x}
                    y2={n.y}
                    stroke={hex}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray="1 5"
                    vectorEffect="non-scaling-stroke"
                    style={{ animation: "ps-flow 0.9s linear infinite" }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Traveling particles along each beam */}
        {active && !reduce &&
          NODES.map((n, i) => (
            <motion.span
              key={`pkt-${n.label}`}
              aria-hidden
              className={cn(
                "absolute z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                n.accent === "brand" ? "bg-brand-500" : "bg-ai-500",
              )}
              style={{ boxShadow: `0 0 8px ${n.accent === "brand" ? "#10b981" : "#3b82f6"}` }}
              initial={{ left: "50%", top: "50%", opacity: 0 }}
              animate={{ left: ["50%", `${n.x}%`], top: ["50%", `${n.y}%`], opacity: [0, 1, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
            />
          ))}

        {/* Capability chips — scattered until unified, then orbit */}
        {NODES.map((n, i) => {
          const target = unifiedOn ? { left: `${n.x}%`, top: `${n.y}%` } : { left: `${n.sx}%`, top: `${n.sy}%` };
          const jitterDur = 3 + (i % 4) * 0.5;
          return (
            <motion.div
              key={n.label}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              initial={false}
              animate={target}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: unifiedOn ? i * 0.04 : 0 }}
            >
              <motion.span
                className={cn(
                  "block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors sm:text-sm",
                  unifiedOn
                    ? n.accent === "brand"
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-ai-200 bg-ai-50 text-ai-700"
                    : "border-dashed border-ink-300 bg-white/70 text-ink-400 backdrop-blur-sm",
                )}
                animate={
                  unifiedOn || reduce
                    ? { y: 0, rotate: 0 }
                    : { y: [0, -5, 0], rotate: [-2, 2, -2] }
                }
                transition={
                  unifiedOn || reduce
                    ? { duration: 0.4 }
                    : { duration: jitterDur, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.3 }
                }
              >
                {n.label}
              </motion.span>
            </motion.div>
          );
        })}

        {/* Central glowing core — the Commerce OS */}
        <div
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          onMouseEnter={() => setCoreHover(true)}
          onMouseLeave={() => setCoreHover(false)}
        >
          <div className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32">
            {!reduce && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)" }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-1 rounded-full border border-ai-400/50"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.25, 0.7] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}
            <motion.div
              className="relative z-10 grid h-24 w-24 place-items-center rounded-full text-center sm:h-28 sm:w-28"
              style={{
                background: "radial-gradient(circle at 30% 30%, #10b981, #1d4ed8)",
                boxShadow: "0 0 55px rgba(16,185,129,0.5), inset 0 0 20px rgba(255,255,255,0.25)",
              }}
              animate={reduce ? {} : { scale: coreHover ? 1.06 : [1, 1.04, 1] }}
              transition={
                coreHover
                  ? { duration: 0.3 }
                  : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <div className="flex flex-col items-center gap-0.5 px-2">
                <span className="font-display text-sm font-extrabold tracking-tight text-white sm:text-base">EcomStrait</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:text-[10px]">Commerce OS</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Controls: trigger + replay */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button
          variant={unifiedOn ? "outline" : "primary"}
          size="md"
          onClick={() => setUnifiedOn((v) => !v)}
          aria-label={unifiedOn ? "Reset the tools back to a scattered stack" : "Unify the tools with EcomStrait"}
        >
          {unifiedOn ? (
            <><RotateCcw className="h-4 w-4" /> Reset the chaos</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Unify with EcomStrait</>
          )}
        </Button>
        <Button href="/why-ecomstrait" variant="outline" size="md">
          See why we&apos;re different <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Reveal>
  );
}
