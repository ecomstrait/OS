"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Sparkles, RotateCcw, LayoutDashboard, Boxes, Users, Truck,
  Search, BarChart3, MessageSquare, FileText, CreditCard, Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

type Tool = {
  label: string;
  icon: IconType;
  /** scattered starting position (percent of stage) */
  from: { x: number; y: number };
};

/* Ten scattered point tools that converge into one platform. */
const TOOLS: Tool[] = [
  { label: "Store Builder", icon: LayoutDashboard, from: { x: 12, y: 16 } },
  { label: "Suppliers", icon: Boxes, from: { x: 84, y: 12 } },
  { label: "Agency", icon: Users, from: { x: 6, y: 48 } },
  { label: "Dropshipping", icon: Truck, from: { x: 90, y: 44 } },
  { label: "SEO Tool", icon: Search, from: { x: 16, y: 82 } },
  { label: "Analytics", icon: BarChart3, from: { x: 82, y: 84 } },
  { label: "Marketing", icon: MessageSquare, from: { x: 40, y: 6 } },
  { label: "Copywriting", icon: FileText, from: { x: 62, y: 92 } },
  { label: "Payments", icon: CreditCard, from: { x: 28, y: 34 } },
  { label: "Inventory", icon: Package, from: { x: 72, y: 66 } },
];

const CENTER = { x: 50, y: 50 };
const EASE = [0.22, 1, 0.36, 1] as const;

/** Ring position each tool settles into once converged. */
function ringPos(i: number, total: number) {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER.x + Math.cos(angle) * 33,
    y: CENTER.y + Math.sin(angle) * 30,
  };
}

export function WhyHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();
  const [converged, setConverged] = useState(false);

  // Auto-play the convergence once, when the hero scrolls into view.
  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setConverged(true), reduce ? 0 : 950);
    return () => window.clearTimeout(t);
  }, [inView, reduce]);

  const replay = () => {
    if (reduce) return;
    setConverged(false);
    window.setTimeout(() => setConverged(true), 650);
  };

  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <style>{`@keyframes why-hero-dash { to { stroke-dashoffset: -24; } }`}</style>

      {/* ---- Ambient backdrop ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <OceanBackdrop accentHex="#10b981" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.55), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />

      <div className="container-px relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* ---- Copy column ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex flex-col items-start gap-5"
          >
            <Badge tone="light" className="backdrop-blur">
              Why EcomStrait
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl md:text-[3.25rem]">
              More than a marketplace. More than a website builder.
            </h1>
            <p className="max-w-xl text-lg text-ink-200 sm:text-xl">
              EcomStrait combines suppliers, AI, automation, and commerce technology into one
              intelligent platform that helps you launch, manage, and grow.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button href="/store-owners" variant="primary" size="lg">
                Launch My Store <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/suppliers" variant="outline-light" size="lg">
                Become a Supplier
              </Button>
            </div>
          </motion.div>

          {/* ---- Convergence stage ---- */}
          <ConvergenceStage
            ref={ref}
            converged={converged || !!reduce}
            reduce={!!reduce}
            onReplay={replay}
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  "10 scattered tools → 1 platform" convergence                     */
/* ------------------------------------------------------------------ */

function ConvergenceStage({
  ref,
  converged,
  reduce,
  onReplay,
}: {
  ref: React.Ref<HTMLDivElement>;
  converged: boolean;
  reduce: boolean;
  onReplay: () => void;
}) {
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-lg">
      <div className="relative aspect-square w-full">
        {/* ---- Connection beams (drawn behind everything) ---- */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            {/* userSpaceOnUse so perfectly vertical/horizontal beams (zero-area
                bounding box) still render — objectBoundingBox makes them vanish. */}
            <linearGradient id="why-hero-beam" gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="100" y2="50">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {TOOLS.map((_, i) => {
            const p = ringPos(i, TOOLS.length);
            return (
              <g key={i}>
                <motion.line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={p.x}
                  y2={p.y}
                  stroke="url(#why-hero-beam)"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  animate={
                    converged
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.7, delay: converged ? 0.45 + i * 0.04 : 0, ease: EASE }}
                />
                {converged && !reduce && (
                  <motion.circle
                    r={0.9}
                    fill="#fff"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      delay: 0.9 + i * 0.12,
                      ease: "easeInOut",
                    }}
                  >
                    <animateMotion
                      dur={`${1.8 + (i % 3) * 0.4}s`}
                      begin={`-${i * 0.2}s`}
                      repeatCount="indefinite"
                      keyPoints="1;0"
                      keyTimes="0;1"
                      calcMode="linear"
                      path={`M ${p.x} ${p.y} L ${CENTER.x} ${CENTER.y}`}
                    />
                  </motion.circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* ---- Central EcomStrait orb ---- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32">
            {!reduce && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)" }}
                  animate={
                    converged
                      ? { scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }
                      : { scale: 0.4, opacity: 0 }
                  }
                  transition={
                    converged
                      ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.4 }
                  }
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-1 rounded-full border"
                  style={{ borderColor: "rgba(16,185,129,0.4)" }}
                  animate={
                    converged
                      ? { scale: [1, 1.12, 1], opacity: [0.7, 0.25, 0.7] }
                      : { scale: 0.4, opacity: 0 }
                  }
                  transition={
                    converged
                      ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.4 }
                  }
                />
              </>
            )}
            <motion.div
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={
                converged
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.5, opacity: reduce ? 1 : 0.35 }
              }
              transition={{ duration: 0.6, delay: converged ? 0.3 : 0, ease: EASE }}
              className="relative grid h-20 w-20 place-items-center rounded-full sm:h-24 sm:w-24"
              style={{
                background: "radial-gradient(circle at 30% 30%, #10b981, #047857)",
                boxShadow: "0 0 60px rgba(16,185,129,0.55), inset 0 0 18px rgba(255,255,255,0.25)",
              }}
            >
              <div className="flex flex-col items-center text-center">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="mt-0.5 font-display text-xs font-extrabold tracking-tight text-white">
                  EcomStrait
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ---- Tool chips ---- */}
        {TOOLS.map((tool, i) => {
          const to = ringPos(i, TOOLS.length);
          const pos = converged ? to : tool.from;
          const Ic = tool.icon;
          return (
            <motion.div
              key={tool.label}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              initial={reduce ? false : { opacity: 0 }}
              animate={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                opacity: 1,
                scale: converged ? 0.86 : 1,
              }}
              transition={{
                duration: reduce ? 0 : 0.9,
                delay: converged ? 0.2 + i * 0.05 : i * 0.03,
                ease: EASE,
              }}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur transition-colors",
                  converged
                    ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
                    : "border-white/12 bg-white/5 text-white/70",
                )}
              >
                <Ic className={cn("h-3.5 w-3.5", converged ? "text-brand-300" : "text-ai-400")} />
                <span className="hidden sm:inline">{tool.label}</span>
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ---- Replay control ---- */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/60">
        <span className="font-medium">Ten scattered tools, one platform</span>
        <button
          type="button"
          onClick={onReplay}
          aria-label="Replay the convergence animation"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-white/80 transition-colors hover:border-brand-400/50 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Replay
        </button>
      </div>
    </div>
  );
}
