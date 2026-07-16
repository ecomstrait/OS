"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Play, Sparkles, Wand2, Search, MessageSquare,
  PenTool, TrendingUp, LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

type Node = {
  icon: IconType;
  label: string;
  caption: string;
  /** position on the SVG viewBox (0..400) */
  x: number;
  y: number;
  /** left/top as % for the HTML overlay */
  left: string;
  top: string;
};

const RAW_NODES: { icon: IconType; label: string; caption: string }[] = [
  { icon: Wand2, label: "Website Builder", caption: "Generates your storefront" },
  { icon: Search, label: "SEO", caption: "Optimizes you to rank" },
  { icon: MessageSquare, label: "Marketing", caption: "Drafts campaigns & ads" },
  { icon: PenTool, label: "Product Writer", caption: "Writes your catalog" },
  { icon: TrendingUp, label: "Forecasting", caption: "Predicts your demand" },
  { icon: LineChart, label: "Analytics", caption: "Answers your data" },
];

const CENTER = 200;
const RADIUS = 150;

const NODES: Node[] = RAW_NODES.map((n, i) => {
  const angle = (-90 + i * (360 / RAW_NODES.length)) * (Math.PI / 180);
  const x = CENTER + RADIUS * Math.cos(angle);
  const y = CENTER + RADIUS * Math.sin(angle);
  return {
    ...n,
    x,
    y,
    left: `${(x / 400) * 100}%`,
    top: `${(y / 400) * 100}%`,
  };
});

const CYCLE_MS = 2200;
const EASE = [0.22, 1, 0.36, 1] as const;

export function AiPlatformHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const select = useCallback((i: number) => {
    setActive(((i % NODES.length) + NODES.length) % NODES.length);
  }, []);

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % NODES.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [reduce, paused]);

  const activeNode = NODES[active];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink-950 text-white"
    >
      <style>{`
        @keyframes aiph-dash { to { stroke-dashoffset: -28; } }
      `}</style>

      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <OceanBackdrop accentHex="#3b82f6" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.55), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />

      <div className="container-px relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* ---- Copy ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-ai-400" />
              EcomAI Platform
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              AI that works for your business
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-200 sm:text-xl lg:mx-0">
              From building your website to forecasting sales, EcomAI is the intelligence layer running quietly behind every part of your store.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button href="/store-owners" variant="primary" size="lg">
                Try It Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="#demo" variant="outline-light" size="lg">
                <Play className="h-4 w-4" /> See the Demo
              </Button>
            </div>
          </motion.div>

          {/* ---- Neural hub visual ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative aspect-square">
              {/* rotating decorative orbit rings */}
              {!reduce && (
                <>
                  <motion.span
                    aria-hidden
                    className="absolute inset-[8%] rounded-full border border-dashed border-white/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.span
                    aria-hidden
                    className="absolute inset-[22%] rounded-full border border-white/10"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent, rgba(59,130,246,0.18), transparent 40%)",
                    }}
                  />
                </>
              )}

              {/* beams + particles */}
              <svg
                aria-hidden
                viewBox="0 0 400 400"
                className="absolute inset-0 h-full w-full"
              >
                <defs>
                  <radialGradient id="aiph-beam" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.08" />
                  </radialGradient>
                </defs>
                {NODES.map((n, i) => {
                  const d = `M ${CENTER} ${CENTER} L ${n.x} ${n.y}`;
                  const isActive = i === active;
                  return (
                    <g key={n.label}>
                      <path
                        d={d}
                        fill="none"
                        stroke={isActive ? "#10b981" : "url(#aiph-beam)"}
                        strokeWidth={isActive ? 2 : 1.25}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {!reduce && (
                        <path
                          d={d}
                          fill="none"
                          stroke={isActive ? "#34d399" : "#3b82f6"}
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeDasharray="2 12"
                          style={{
                            animation: "aiph-dash 1.3s linear infinite",
                            animationDirection: i % 2 ? "reverse" : "normal",
                            opacity: isActive ? 0.9 : 0.4,
                          }}
                        />
                      )}
                      {!reduce && (
                        <circle r={i === active ? 3.5 : 2.5} fill={isActive ? "#fff" : "#93c5fd"}>
                          <animateMotion
                            dur={`${2 + (i % 3) * 0.4}s`}
                            begin={`-${i * 0.4}s`}
                            repeatCount="indefinite"
                            path={d}
                            keyPoints={i % 2 ? "1;0" : "0;1"}
                            keyTimes="0;1"
                            calcMode="linear"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* capability nodes */}
              {NODES.map((n, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={n.label}
                    type="button"
                    onClick={() => select(i)}
                    aria-label={n.label}
                    aria-pressed={isActive}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    style={{ left: n.left, top: n.top }}
                  >
                    <motion.span
                      animate={
                        reduce
                          ? {}
                          : isActive
                            ? { scale: 1.12 }
                            : { scale: [1, 1.04, 1] }
                      }
                      transition={
                        isActive
                          ? { duration: 0.3 }
                          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-2xl border backdrop-blur transition-colors sm:h-14 sm:w-14",
                        isActive
                          ? "border-brand-400/60 bg-brand-500/25 text-brand-200 shadow-lg shadow-brand-500/30"
                          : "border-white/12 bg-white/5 text-ai-200 hover:border-ai-400/50 hover:bg-ai-500/15",
                      )}
                    >
                      <n.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.span>
                  </button>
                );
              })}

              {/* central EcomAI brain orb */}
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32">
                  {!reduce && (
                    <>
                      <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: "radial-gradient(circle, #3b82f688, transparent 70%)" }}
                      />
                      <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.25, 0.7] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-1 rounded-full border border-ai-400/50"
                      />
                    </>
                  )}
                  <motion.div
                    animate={reduce ? {} : { scale: [1, 1.04, 1] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative grid h-20 w-20 place-items-center rounded-full text-center sm:h-24 sm:w-24"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8)",
                      boxShadow: "0 0 60px #3b82f688, inset 0 0 20px rgba(255,255,255,0.25)",
                    }}
                  >
                    <span className="font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
                      EcomAI
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* live caption reflecting the active node */}
            <div
              aria-live="polite"
              className="mx-auto mt-4 flex min-h-[2.75rem] max-w-xs flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center backdrop-blur"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {activeNode.label}
              </p>
              <p className="text-[11px] text-white/60">{activeNode.caption}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
