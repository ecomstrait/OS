"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Search, Sparkles, Boxes, Tag, Warehouse, Layers,
  DollarSign, Store, ListChecks, ClipboardList, CreditCard, Users, Brain,
  RefreshCw, BarChart3, CheckCircle2, Rocket, Handshake,
  TrendingUp, MapPin, ChevronDown,
  // Play — only used by the "Watch AI build a business" button, commented
  // out below alongside the hidden AI Website Builder demo.
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { merchantSignupUrl, supplierSignupUrl } from "@/lib/site";

type IconType = React.ComponentType<{ className?: string }>;

/* ------------------------------------------------------------------ */
/*  Slide content — mirrors the two-panel "strait" concept            */
/* ------------------------------------------------------------------ */

type Feature = { icon: IconType; label: string };
type Slide = {
  id: string;
  eyebrow: string;
  supplierItems: Feature[];
  storeItems: Feature[];
  chips: Feature[];
  center: { sub: string };
  /** particle direction along the beams */
  direction: "forward" | "reverse";
  accent: "ai" | "brand";
};

const SLIDES: Slide[] = [
  {
    id: "connect",
    eyebrow: "Tell EcomAI what to build — launch in minutes.",
    direction: "forward",
    accent: "ai",
    center: { sub: "Build · Manage · Automate" },
    supplierItems: [
      { icon: Boxes, label: "Inventory" },
      { icon: Tag, label: "Products" },
      { icon: Warehouse, label: "Warehouse" },
      { icon: Layers, label: "Bulk Supply" },
      { icon: DollarSign, label: "Best Prices" },
    ],
    storeItems: [
      { icon: Store, label: "Online Store" },
      { icon: ListChecks, label: "Product Listing" },
      { icon: ClipboardList, label: "Order Management" },
      { icon: CreditCard, label: "Payments" },
      { icon: Users, label: "Customer Reach" },
    ],
    chips: [
      // AI Website Builder — hidden from the site for now, not removed.
      // { icon: Sparkles, label: "AI Website Builder" },
      { icon: Brain, label: "AI Business Consultant" },
      { icon: RefreshCw, label: "Smart Automation" },
      { icon: BarChart3, label: "Real-time Insights" },
    ],
  },
  {
    id: "deliver",
    eyebrow: "Orders Delivered. Relationships Strengthened.",
    direction: "reverse",
    accent: "brand",
    center: { sub: "Automated Fulfillment" },
    supplierItems: [
      { icon: CheckCircle2, label: "Order Received" },
      { icon: CheckCircle2, label: "Packing" },
      { icon: CheckCircle2, label: "Shipping" },
      { icon: CheckCircle2, label: "Delivered" },
      { icon: CheckCircle2, label: "Growth" },
    ],
    storeItems: [
      { icon: CheckCircle2, label: "Order Placed" },
      { icon: CheckCircle2, label: "Payment Success" },
      { icon: CheckCircle2, label: "Processing" },
      { icon: CheckCircle2, label: "Shipped" },
      { icon: CheckCircle2, label: "Customer Happy" },
    ],
    chips: [
      { icon: Rocket, label: "Faster Deliveries" },
      { icon: DollarSign, label: "Lower Costs" },
      { icon: Handshake, label: "Better Relationships" },
      { icon: TrendingUp, label: "Business Growth" },
      { icon: Sparkles, label: "Powered by AI" },
    ],
  },
];

const HEADLINES: Record<string, React.ReactNode> = {
  connect: (
    <>
      Build your online business.{" "}
      <span className="text-gradient">AI handles everything.</span>
    </>
  ),
  deliver: (
    <>
      From Stores to Suppliers —{" "}
      <span className="text-gradient">Orders Delivered</span>
    </>
  ),
};

const AUTO_MS = 7000;
const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const slide = SLIDES[index];

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, index]);

  const accentHex = slide.accent === "ai" ? "#3b82f6" : "#10b981";

  return (
    <section
      className="relative overflow-hidden bg-ink-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`@keyframes strait-dash { to { stroke-dashoffset: -32; } }`}</style>

      {/* ---- Ocean backdrop ---- */}
      <OceanBackdrop accentHex={accentHex} />

      {/* ---- Ambient backdrop: night strait ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-25" />
      <motion.div
        aria-hidden
        key={`glow-${slide.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute left-1/2 top-[42%] h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentHex}55, transparent 68%)` }}
      />

      <div className="container-px relative py-14 sm:py-16 lg:py-20">
        {/* ---- Headline ---- */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-ai-400" />
            The world&apos;s first AI Ecommerce Co-Founder
          </motion.span>

          <div className="mt-6 min-h-[7.5rem] sm:min-h-[8.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.25rem]">
                  {HEADLINES[slide.id]}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-base text-white/60 sm:text-lg">
                  {slide.eyebrow}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ---- The animated strait ---- */}
        <StraitStage slide={slide} reduce={!!reduce} accentHex={accentHex} />

        {/* ---- Feature chips (per slide) ---- */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <AnimatePresence mode="popLayout">
            {slide.chips.map((c, i) => (
              <motion.span
                key={`${slide.id}-${c.label}`}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.94 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur"
              >
                <c.icon className={slide.accent === "ai" ? "h-4 w-4 text-ai-400" : "h-4 w-4 text-brand-400"} />
                {c.label}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* ---- CTAs ---- */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
            <Button href={merchantSignupUrl} variant="primary" size="lg">
              Build My Business <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href={supplierSignupUrl} variant="ai" size="lg">
              <Search className="h-4 w-4" /> Find a Supplier
            </Button>
            {/* "Watch AI build a business" linked to the AI Website Builder
                demo, which is hidden for now (see app/(site)/page.tsx). */}
            {/* <Button href="#builder" variant="outline-light" size="lg">
              <Play className="h-4 w-4" /> Watch AI build a business
            </Button> */}
          </div>

          {/* Slide controls */}
          <div className="mt-2 flex items-center gap-3">
            {SLIDES.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={s.id}
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={active}
                  className="relative h-2.5 overflow-hidden rounded-full transition-all duration-300"
                  style={{
                    width: active ? 40 : 10,
                    background: active ? `${accentHex}40` : "rgba(255,255,255,0.25)",
                  }}
                >
                  {active && (
                    <motion.span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: accentHex }}
                      initial={{ width: "0%" }}
                      animate={{ width: paused ? "22%" : "100%" }}
                      transition={{ duration: paused ? 0.4 : AUTO_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="ml-1 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Strait stage — panels + beams + AI orb                            */
/* ------------------------------------------------------------------ */

function StraitStage({
  slide,
  reduce,
  accentHex,
}: {
  slide: Slide;
  reduce: boolean;
  accentHex: string;
}) {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-6xl">
      {/* Beams layer (behind panels, desktop only) */}
      <ConnectionBeams direction={slide.direction} accentHex={accentHex} reduce={reduce} />

      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <SidePanel
          title="SUPPLIERS"
          items={slide.supplierItems}
          align="left"
          accent={slide.accent}
          accentHex={accentHex}
          slideId={slide.id}
          reduce={reduce}
          reversed={slide.direction === "reverse"}
        />

        <CenterOrb slide={slide} accentHex={accentHex} reduce={reduce} />

        <SidePanel
          title="ONLINE STORES"
          items={slide.storeItems}
          align="right"
          accent={slide.accent}
          accentHex={accentHex}
          slideId={slide.id}
          reduce={reduce}
          reversed={slide.direction === "reverse"}
        />
      </div>
    </div>
  );
}

function SidePanel({
  title,
  items,
  align,
  accent,
  accentHex,
  slideId,
  reduce,
  reversed,
}: {
  title: string;
  items: Feature[];
  align: "left" | "right";
  accent: "ai" | "brand";
  accentHex: string;
  slideId: string;
  reduce: boolean;
  reversed: boolean;
}) {
  const isLeft = align === "left";
  const n = items.length;
  const STEP = 0.45; // stagger between rows in the sweep
  const PULSE = 0.75; // how long each row stays lit
  const CYCLE = n * STEP + 1.2; // full sweep + rest
  const pinColor = isLeft ? "text-ai-400" : "text-brand-400";
  const badge = isLeft
    ? "border-ai-400/40 bg-ai-500/15 text-ai-200"
    : "border-brand-400/40 bg-brand-500/15 text-brand-200";

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`relative w-full max-w-xs ${isLeft ? "lg:justify-self-start" : "lg:justify-self-end"}`}
    >
      <div
        className="mb-3 flex items-center gap-2"
        style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}
      >
        <MapPin className={`h-4 w-4 ${pinColor}`} />
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider ${badge}`}>
          {title}
        </span>
      </div>

      <div className="glass-dark rounded-2xl p-3">
        <ul className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {items.map((it, i) => {
              // sweep order follows the flow direction
              const order = reversed ? n - 1 - i : i;
              const pulseTransition = {
                duration: PULSE,
                delay: order * STEP,
                repeat: Infinity,
                repeatDelay: CYCLE - PULSE,
                ease: "easeInOut" as const,
              };
              return (
                <motion.li
                  key={`${slideId}-${it.label}`}
                  initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/85 ${isLeft ? "" : "flex-row-reverse text-right"}`}
                >
                  {/* traveling row highlight */}
                  {!reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-lg"
                      style={{ background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${accentHex}26, transparent)` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={pulseTransition}
                    />
                  )}
                  <motion.span
                    className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                      accent === "ai" ? "bg-ai-500/15 text-ai-300" : "bg-brand-500/15 text-brand-300"
                    }`}
                    animate={reduce ? {} : { scale: [1, 1.15, 1], boxShadow: [`0 0 0px ${accentHex}00`, `0 0 12px ${accentHex}aa`, `0 0 0px ${accentHex}00`] }}
                    transition={pulseTransition}
                  >
                    <it.icon className="h-4 w-4" />
                  </motion.span>
                  <span className="relative font-medium">{it.label}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </motion.div>
  );
}

function CenterOrb({
  slide,
  accentHex,
  reduce,
}: {
  slide: Slide;
  accentHex: string;
  reduce: boolean;
}) {
  const isAi = slide.accent === "ai";
  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <div className="relative grid h-32 w-32 place-items-center sm:h-40 sm:w-40">
        {!reduce && (
          <>
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${accentHex}66, transparent 70%)` }}
            />
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.3, 0.7] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full border"
              style={{ borderColor: `${accentHex}55` }}
            />
          </>
        )}
        <motion.div
          animate={reduce ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-24 w-24 place-items-center rounded-full sm:h-28 sm:w-28"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accentHex}, ${isAi ? "#1d4ed8" : "#047857"})`,
            boxShadow: `0 0 60px ${accentHex}88, inset 0 0 20px rgba(255,255,255,0.25)`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <span className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
                {isAi ? "EcomAI" : "Strait"}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="mt-3 text-center"
        >
          <p className="font-display text-sm font-bold text-white">
            {isAi ? "EcomAI" : "Orders Delivered"}
          </p>
          <p className="text-[11px] text-white/50">{slide.center.sub}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Connection beams — SVG paths with flowing particles               */
/* ------------------------------------------------------------------ */

const BEAMS = [
  "M 60 210 C 260 120, 380 100, 500 200",
  "M 60 260 C 260 240, 380 210, 500 210",
  "M 60 310 C 260 380, 380 330, 500 220",
  "M 500 200 C 620 100, 740 120, 940 210",
  "M 500 210 C 620 210, 740 240, 940 260",
  "M 500 220 C 620 330, 740 380, 940 310",
].map((d, i) => ({ id: `strait-beam-${i}`, d }));

function ConnectionBeams({
  direction,
  accentHex,
  reduce,
}: {
  direction: "forward" | "reverse";
  accentHex: string;
  reduce: boolean;
}) {
  const reversed = direction === "reverse";
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 420"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
    >
      <defs>
        <linearGradient id="strait-beam-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accentHex} stopOpacity="0.05" />
          <stop offset="50%" stopColor={accentHex} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accentHex} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* reference / base paths */}
      {BEAMS.map((b) => (
        <path
          key={b.id}
          id={b.id}
          d={b.d}
          fill="none"
          stroke="url(#strait-beam-fade)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}

      {/* flowing dashed overlay */}
      {!reduce &&
        BEAMS.map((b) => (
          <path
            key={`flow-${b.id}`}
            d={b.d}
            fill="none"
            stroke={accentHex}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 14"
            style={{
              animation: "strait-dash 1.4s linear infinite",
              animationDirection: reversed ? "reverse" : "normal",
              filter: `drop-shadow(0 0 4px ${accentHex})`,
            }}
          />
        ))}

      {/* traveling packets */}
      {!reduce &&
        BEAMS.map((b, i) => (
          <circle key={`pkt-${b.id}-${direction}`} r={3.5} fill="#fff" opacity={0.95}>
            {/* negative begin => already mid-path at load, never parks at (0,0) */}
            <animateMotion
              dur={`${2.4 + (i % 3) * 0.5}s`}
              begin={`-${i * 0.55}s`}
              repeatCount="indefinite"
              keyPoints={reversed ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
              rotate="auto"
            >
              <mpath href={`#${b.id}`} />
            </animateMotion>
          </circle>
        ))}
    </svg>
  );
}
