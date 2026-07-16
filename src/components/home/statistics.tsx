"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { StatCounter } from "@/components/shared/stat-counter";
import { platformStats } from "@/content/stats";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Accent per tile — alternating emerald / electric-blue, echoing the hero. */
const TILE_ACCENTS = [
  "#10b981",
  "#3b82f6",
  "#10b981",
  "#3b82f6",
  "#10b981",
  "#3b82f6",
] as const;

/** Believable, on-brand platform events for the live activity ticker. */
const ACTIVITY_EVENTS = [
  "🚀 New store launched — Lumière Beauty",
  "📦 Order routed to supplier — NorthField Textiles",
  "🤖 EcomAI generated 42 product descriptions",
  "✅ Supplier verified — Peak Sports Gear",
  "💳 Payment processed — $128",
  "🌍 New market unlocked — Portugal",
  "🏷️ 1,240 products auto-priced by EcomAI",
  "🤝 Wholesale deal matched — Aria Home Goods",
  "📈 Store crossed $10K in monthly sales",
  "⚡ Inventory synced across 3 warehouses",
] as const;

/** Deterministic floating-particle seeds — no Math.random at SSR/module scope. */
const PARTICLES = [
  { left: "12%", top: "24%", size: 6, delay: 0, duration: 9, hex: "#10b981" },
  { left: "82%", top: "18%", size: 4, delay: 1.6, duration: 11, hex: "#3b82f6" },
  { left: "68%", top: "70%", size: 5, delay: 0.8, duration: 10, hex: "#10b981" },
  { left: "28%", top: "72%", size: 4, delay: 2.4, duration: 12, hex: "#3b82f6" },
  { left: "48%", top: "12%", size: 3, delay: 3.1, duration: 8, hex: "#3b82f6" },
  { left: "92%", top: "52%", size: 5, delay: 1.1, duration: 13, hex: "#10b981" },
] as const;

const TICKER_MS = 2600;

export function Statistics() {
  const reduce = useReducedMotion();

  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick((t) => t + 1), TICKER_MS);
    return () => clearInterval(id);
  }, [paused]);

  const eventIndex = tick % ACTIVITY_EVENTS.length;

  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
      <style>{`@keyframes stats-live-ping { 0% { transform: scale(1); opacity: 0.7; } 75%, 100% { transform: scale(2.4); opacity: 0; } }`}</style>

      {/* ---- Ambient backdrop ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-4 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.45), transparent 68%)" }}
        animate={reduce ? {} : { opacity: [0.15, 0.3, 0.15], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* slow floating particles */}
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.hex,
                boxShadow: `0 0 12px ${p.hex}`,
              }}
              animate={{ y: [0, -22, 0], opacity: [0.15, 0.7, 0.15] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="container-px relative">
        <Reveal className="mx-auto mb-6 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">
            By the numbers
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            A platform businesses grow on
          </h2>
        </Reveal>

        {/* ---- Live activity ticker ---- */}
        <Reveal className="mx-auto mb-12 max-w-md" delay={1}>
          <div
            role="status"
            aria-live="polite"
            aria-label="Live platform activity"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            tabIndex={0}
            className="glass-dark flex items-center gap-3 rounded-full border border-white/10 px-4 py-2.5 outline-none transition-colors focus-visible:border-brand-400/60"
          >
            {/* pulsing live dot */}
            <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-brand-500"
                style={
                  reduce
                    ? undefined
                    : { animation: "stats-live-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }
                }
              />
              <span className="relative h-2.5 w-2.5 rounded-full bg-brand-400" />
            </span>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-brand-300">
              Live
            </span>
            <div className="relative h-5 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={eventIndex}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute inset-0 truncate text-sm text-white/80"
                >
                  {ACTIVITY_EVENTS[eventIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        {/* ---- Glowing stat tiles ---- */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {platformStats.map((stat, i) => {
            const accent = TILE_ACCENTS[i % TILE_ACCENTS.length];
            return (
              <StatTile key={stat.label} index={i} accent={accent} reduce={!!reduce}>
                <StatCounter stat={stat} invert />
              </StatTile>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass tile — scroll-stagger entrance, hover lift + accent glow     */
/* ------------------------------------------------------------------ */

function StatTile({
  children,
  index,
  accent,
  reduce,
}: {
  children: React.ReactNode;
  index: number;
  accent: string;
  reduce: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: EASE }}
      whileHover={reduce ? undefined : { y: -6 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={cn(
        "glass-dark group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-center transition-colors sm:p-5",
      )}
      style={{ borderColor: hover ? `${accent}66` : undefined }}
    >
      {/* accent glow that intensifies on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
          opacity: hover ? 0.5 : 0.18,
        }}
      />
      {/* accent underline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
          opacity: hover ? 1 : 0.4,
        }}
      />
      <div className="relative flex flex-col items-center gap-1">{children}</div>
    </motion.div>
  );
}
