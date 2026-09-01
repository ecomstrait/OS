"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Wand2, Boxes, Store, ShoppingBag, Code2, Package, FileText, Search,
  Server, Workflow, BarChart3, Bot, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { merchantSignupUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;
type Accent = "brand" | "ai";
type Node = { icon: IconType; label: string; accent: Accent };

/* The full ecommerce stack — every service revolving around the platform. */
const NODES: Node[] = [
  { icon: Wand2, label: "AI Website Development", accent: "brand" }, // 0
  { icon: Boxes, label: "Supplier Management", accent: "ai" }, // 1
  { icon: Store, label: "Store Setup Service", accent: "brand" }, // 2
  { icon: ShoppingBag, label: "Shopify Development", accent: "ai" }, // 3
  { icon: Code2, label: "Custom Ecommerce", accent: "brand" }, // 4
  { icon: Package, label: "Inventory Management", accent: "ai" }, // 5
  { icon: FileText, label: "Product Management", accent: "brand" }, // 6
  { icon: Search, label: "SEO Optimization", accent: "ai" }, // 7
  { icon: Server, label: "Hosting & Maintenance", accent: "brand" }, // 8
  { icon: Workflow, label: "Business Automation", accent: "ai" }, // 9
  { icon: BarChart3, label: "Analytics & Reporting", accent: "brand" }, // 10
  { icon: Bot, label: "AI Business Consultant", accent: "ai" }, // 11
];

/* Three orbits, four services each, counter-rotating at different speeds. */
const RINGS = [
  { indices: [0, 1, 2, 3], radiusPct: 46, duration: 52, dir: 1 as const },
  { indices: [4, 5, 6, 7], radiusPct: 33, duration: 40, dir: -1 as const },
  { indices: [8, 9, 10, 11], radiusPct: 21, duration: 30, dir: 1 as const },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const hex = (a: Accent) => (a === "ai" ? "#3b82f6" : "#10b981");

export function ServicesHero() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  const activeAccent = hovered !== null ? hex(NODES[hovered].accent) : "#3b82f6";

  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <style>{`@keyframes svc-orbit-dash { to { stroke-dashoffset: -400; } }`}</style>

      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <OceanBackdrop accentHex="#3b82f6" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.5), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />

      <div className="container-px relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          {/* ---- Copy ---- */}
          <motion.div
            initial={reduce ? false : "hidden"}
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.09 } },
            }}
            className="text-center lg:text-left"
          >
            <motion.span
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              AI Business Services
            </motion.span>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
            >
              Your AI team of specialists
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mx-auto mt-5 max-w-2xl text-lg text-ink-200 sm:text-xl lg:mx-0"
            >
              EcomAI works like a full team of specialists — builder, marketer, SEO consultant,
              analyst, and advisor — running your entire business from a single prompt.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button href={merchantSignupUrl} variant="primary" size="lg">
                Build My Business <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/contact" variant="outline-light" size="lg">Book a Demo</Button>
            </motion.div>
          </motion.div>

          {/* ---- Orbital visual: every service revolving around the core ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="relative mx-auto aspect-square w-full max-w-[26rem] sm:max-w-[30rem]"
          >
            <OrbitField reduce={!!reduce} accentHex={activeAccent} />

            {RINGS.map((ring, r) => (
              <Ring
                key={r}
                indices={ring.indices}
                radiusPct={ring.radiusPct}
                duration={ring.duration}
                dir={ring.dir}
                reduce={!!reduce}
                hovered={hovered}
                onHover={setHovered}
              />
            ))}

            <CenterOrb reduce={!!reduce} accentHex={activeAccent} hovered={hovered} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Rotating orbit rings + streaming beams                            */
/* ------------------------------------------------------------------ */

function OrbitField({ reduce, accentHex }: { reduce: boolean; accentHex: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {RINGS.map((ring) => (
        <circle
          key={ring.radiusPct}
          cx="50"
          cy="50"
          r={ring.radiusPct}
          fill="none"
          stroke={accentHex}
          strokeOpacity="0.2"
          strokeWidth="0.35"
          strokeDasharray="1.4 3"
          style={reduce ? undefined : { animation: `svc-orbit-dash ${ring.radiusPct * 1.6}s linear infinite` }}
        />
      ))}
      {/* streaming spokes into the core */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 46;
        const y = 50 + Math.sin(rad) * 46;
        return (
          <line
            key={deg}
            x1={x}
            y1={y}
            x2="50"
            y2="50"
            stroke={accentHex}
            strokeOpacity="0.1"
            strokeWidth="0.3"
            strokeDasharray="0.8 2.2"
            style={reduce ? undefined : { animation: "svc-orbit-dash 6s linear infinite" }}
          />
        );
      })}
    </svg>
  );
}

function Ring({
  indices,
  radiusPct,
  duration,
  dir,
  reduce,
  hovered,
  onHover,
}: {
  indices: number[];
  radiusPct: number;
  duration: number;
  dir: 1 | -1;
  reduce: boolean;
  hovered: number | null;
  onHover: (i: number | null) => void;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      animate={reduce ? undefined : { rotate: dir * 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {indices.map((gi, i) => {
        const angle = (i / indices.length) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const left = 50 + Math.cos(rad) * radiusPct;
        const top = 50 + Math.sin(rad) * radiusPct;
        const node = NODES[gi];
        const isActive = hovered === gi;
        const dim = hovered !== null && !isActive;
        return (
          <div
            key={gi}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <motion.button
              type="button"
              onMouseEnter={() => onHover(gi)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(gi)}
              onBlur={() => onHover(null)}
              aria-label={node.label}
              initial={false}
              animate={reduce ? undefined : { rotate: [0, -dir * 360] }}
              transition={reduce ? undefined : { duration, repeat: Infinity, ease: "linear" }}
              whileHover={reduce ? undefined : { scale: 1.18 }}
              className={cn(
                "pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl border backdrop-blur transition-all duration-300 sm:h-11 sm:w-11",
                isActive
                  ? node.accent === "ai"
                    ? "border-ai-400/70 bg-ai-500/25 text-ai-100"
                    : "border-brand-400/70 bg-brand-500/25 text-brand-100"
                  : "border-white/15 bg-white/8 text-white/80 hover:border-white/30",
                dim && "opacity-40",
              )}
              style={{
                boxShadow: isActive
                  ? `0 0 24px ${hex(node.accent)}aa`
                  : `0 0 10px ${hex(node.accent)}33`,
              }}
            >
              <node.icon className="h-[18px] w-[18px]" />
            </motion.button>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Central EcomStrait core                                           */
/* ------------------------------------------------------------------ */

function CenterOrb({
  reduce,
  accentHex,
  hovered,
}: {
  reduce: boolean;
  accentHex: string;
  hovered: number | null;
}) {
  const label = hovered !== null ? NODES[hovered].label : "12 services · one platform";
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative grid h-36 w-36 place-items-center sm:h-40 sm:w-40">
        {!reduce && (
          <>
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.8, 0.45] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${accentHex}66, transparent 70%)` }}
            />
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.25, 0.7] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-3 rounded-full border"
              style={{ borderColor: `${accentHex}55` }}
            />
          </>
        )}
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-24 w-24 place-items-center rounded-full text-center transition-colors duration-500 sm:h-28 sm:w-28"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accentHex}, #0b1327)`,
            boxShadow: `0 0 55px ${accentHex}80, inset 0 0 18px rgba(255,255,255,0.22)`,
          }}
        >
          <span className="font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
            EcomStrait
          </span>
        </motion.div>
      </div>

      <div className="absolute -bottom-3 left-1/2 w-60 -translate-x-1/2 text-center sm:w-72">
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="text-sm font-semibold text-white/90"
          >
            {label}
          </motion.p>
        </AnimatePresence>
        <p className="mt-0.5 text-[11px] text-white/45">Hover a service to explore the stack</p>
      </div>
    </div>
  );
}
