"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence, motion, useInView, useReducedMotion,
} from "framer-motion";
import {
  Sparkles, Warehouse, Store, Package, Bell, CheckCircle2, Pause, Play, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { supplierSignupUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/*  Warehouse → stores flow geometry (SVG viewBox 0 0 480 300)        */
/* ------------------------------------------------------------------ */

const HUB = { x: 96, y: 150 };
const STORES = [
  { id: "s0", x: 404, y: 54, label: "Bloom & Co." },
  { id: "s1", x: 428, y: 120, label: "Nord Supply" },
  { id: "s2", x: 428, y: 186, label: "Urban Threads" },
  { id: "s3", x: 404, y: 250, label: "Field Goods" },
];

const BEAMS = STORES.map((s, i) => {
  const midX = (HUB.x + s.x) / 2;
  const d = `M ${HUB.x} ${HUB.y} C ${midX} ${HUB.y}, ${midX} ${s.y}, ${s.x} ${s.y}`;
  return { id: `sup-beam-${i}`, d, dur: 2.6 + (i % 3) * 0.4 };
});

/* Order-received notifications that pop in over the visual. */
const ORDERS = [
  { store: "Bloom & Co.", item: "Organic Cotton Tee", qty: 120 },
  { store: "Nord Supply", item: "Ceramic Mug Set", qty: 60 },
  { store: "Urban Threads", item: "Denim Jacket", qty: 45 },
  { store: "Field Goods", item: "Trail Backpack", qty: 30 },
  { store: "Aster Home", item: "Linen Throw", qty: 80 },
];

export function SuppliersHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink-950 text-white">
      <style>{`@keyframes sup-dash { to { stroke-dashoffset: -28; } }`}</style>

      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />
      <OceanBackdrop accentHex="#10b981" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.55), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />

      <div className="container-px relative py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* ---- Copy ---- */}
          <div className="flex flex-col items-start gap-6">
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-300 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              For Suppliers
            </motion.span>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
              className="text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl"
            >
              Grow your wholesale business on autopilot
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
              className="max-w-xl text-lg text-ink-200 sm:text-xl"
            >
              Publish once. Get discovered by thousands of store owners. Receive automated
              orders and keep inventory in sync — no spreadsheets required.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button href={supplierSignupUrl} variant="primary" size="lg">Become a Supplier</Button>
              <Button href="/contact" variant="outline-light" size="lg">Talk to Sales</Button>
            </motion.div>
          </div>

          {/* ---- Animated wholesale flow ---- */}
          <FlowVisual inView={inView} reduce={!!reduce} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Flow visual — warehouse streams boxes to stores                   */
/* ------------------------------------------------------------------ */

function FlowVisual({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const [paused, setPaused] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  // live counters
  const [ordersToday, setOrdersToday] = useState(1284);
  const [inSync, setInSync] = useState(1236);

  const running = inView && !paused && !reduce;

  // cycle order notifications
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setOrderIndex((i) => (i + 1) % ORDERS.length), 2600);
    return () => clearInterval(t);
  }, [running]);

  // tick counters upward
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setOrdersToday((n) => n + Math.floor(Math.random() * 3) + 1);
      setInSync((n) => (n < 1240 ? n + 1 : n));
    }, 2600);
    return () => clearInterval(t);
  }, [running]);

  const order = ORDERS[orderIndex];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
      className="relative"
    >
      <div className="glass-dark relative overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
        {/* header row: live counters + control */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Counter label="Orders today" value={ordersToday} accent="text-brand-300" />
            <span className="h-8 w-px bg-white/10" />
            <Counter label="Products in sync" value={inSync} accent="text-ai-300" />
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume flow animation" : "Pause flow animation"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>

        {/* stage */}
        <div className="relative aspect-[480/300] w-full">
          <svg
            viewBox="0 0 480 300"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="sup-beam-fade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* base beams */}
            {BEAMS.map((b) => {
              const isActive = active === b.id;
              return (
                <path
                  key={b.id}
                  id={b.id}
                  d={b.d}
                  fill="none"
                  stroke="url(#sup-beam-fade)"
                  strokeWidth={isActive ? 3 : 1.5}
                  strokeLinecap="round"
                  className="transition-[stroke-width] duration-300"
                />
              );
            })}

            {/* flowing dashes */}
            {!reduce &&
              BEAMS.map((b) => (
                <path
                  key={`flow-${b.id}`}
                  d={b.d}
                  fill="none"
                  stroke={active === b.id ? "#34d399" : "#10b981"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="2 12"
                  style={{
                    animationName: "sup-dash",
                    animationDuration: "1.3s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationPlayState: paused ? "paused" : "running",
                    filter: "drop-shadow(0 0 3px #10b981)",
                    opacity: active && active !== b.id ? 0.3 : 1,
                  }}
                />
              ))}

            {/* traveling boxes */}
            {!reduce &&
              BEAMS.map((b, i) => (
                <rect
                  key={`box-${b.id}`}
                  x={-4}
                  y={-4}
                  width={8}
                  height={8}
                  rx={1.5}
                  fill="#fff"
                  stroke="#10b981"
                  strokeWidth={1}
                  opacity={0.95}
                >
                  <animateMotion
                    dur={`${b.dur}s`}
                    begin={`-${i * 0.6}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${b.id}`} />
                  </animateMotion>
                </rect>
              ))}

            {/* store nodes */}
            {STORES.map((s, i) => {
              const beamId = `sup-beam-${i}`;
              const isActive = active === beamId;
              return (
                <g
                  key={s.id}
                  transform={`translate(${s.x} ${s.y})`}
                  onMouseEnter={() => setActive(beamId)}
                  onMouseLeave={() => setActive(null)}
                  className="cursor-pointer"
                >
                  <circle
                    r={14}
                    fill="#0b1327"
                    stroke={isActive ? "#34d399" : "#3b82f6"}
                    strokeWidth={1.5}
                  />
                  <foreignObject x={-8} y={-8} width={16} height={16}>
                    <div className="grid h-4 w-4 place-items-center text-ai-300">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* hub / warehouse */}
            <g transform={`translate(${HUB.x} ${HUB.y})`}>
              {!reduce && (
                <circle r={26} fill="none" stroke="#10b981" strokeWidth={1} opacity={0.4}>
                  <animate
                    attributeName="r"
                    values="22;30;22"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle r={22} fill="#062e22" stroke="#10b981" strokeWidth={1.5} />
              <foreignObject x={-12} y={-12} width={24} height={24}>
                <div className="grid h-6 w-6 place-items-center text-brand-300">
                  <Warehouse className="h-5 w-5" />
                </div>
              </foreignObject>
            </g>
          </svg>

          {/* node labels */}
          <span className="absolute left-[10%] top-1/2 -translate-x-1/2 translate-y-[26px] rounded-full border border-brand-400/40 bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-200">
            YOUR WAREHOUSE
          </span>

          {/* order-received notification */}
          <div className="pointer-events-none absolute right-2 top-2 w-[62%] max-w-[240px]">
            <AnimatePresence mode="wait">
              {(inView && (running || reduce)) && (
                <motion.div
                  key={reduce ? "static" : orderIndex}
                  initial={reduce ? false : { opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex items-start gap-2.5 rounded-2xl border border-white/12 bg-ink-900/85 px-3 py-2.5 backdrop-blur"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-500/20 text-brand-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                      <Bell className="h-3 w-3 text-brand-300" /> Order received
                    </p>
                    <p className="truncate text-[11px] text-white/60">
                      {order.qty}× {order.item} · {order.store}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* footer legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-brand-300" /> Products streaming out
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-ai-300" /> Inventory in sync
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Counter({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <p className={cn("font-display text-lg font-extrabold tabular-nums", accent)}>
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
    </div>
  );
}
