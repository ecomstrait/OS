"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Monitor, Smartphone, Tablet, Moon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const AUTO_MS = 3200;

/* ------------------------------------------------------------------ */
/*  Device frames + storefront palettes                               */
/* ------------------------------------------------------------------ */

type IconType = React.ComponentType<{ className?: string }>;

type DeviceId = "desktop" | "tablet" | "mobile";

type Device = {
  id: DeviceId;
  icon: IconType;
  label: string;
  maxW: number;
  aspect: number;
  cols: number;
  chrome: "browser" | "tablet" | "phone";
};

const DEVICES: Device[] = [
  { id: "desktop", icon: Monitor, label: "Desktop", maxW: 560, aspect: 1.6, cols: 3, chrome: "browser" },
  { id: "tablet", icon: Tablet, label: "Tablet", maxW: 380, aspect: 0.82, cols: 2, chrome: "tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile", maxW: 236, aspect: 0.5, cols: 2, chrome: "phone" },
];

type Palette = {
  id: string;
  name: string;
  light: string;
  bar: [string, string];
  accent: string;
  card: string;
};

const PALETTES: Palette[] = [
  { id: "fashion", name: "Fashion", light: "#fff1f4", bar: ["#f43f5e", "#fb7185"], accent: "#f43f5e", card: "#ffe4e9" },
  { id: "electronics", name: "Electronics", light: "#eef5ff", bar: ["#3b82f6", "#06b6d4"], accent: "#3b82f6", card: "#dbeafe" },
  { id: "cosmetics", name: "Cosmetics", light: "#faf3ff", bar: ["#a855f7", "#ec4899"], accent: "#a855f7", card: "#f3e8ff" },
  { id: "furniture", name: "Furniture", light: "#fffaeb", bar: ["#f59e0b", "#10b981"], accent: "#f59e0b", card: "#fef1c7" },
  { id: "grocery", name: "Grocery", light: "#f0fdf5", bar: ["#10b981", "#84cc16"], accent: "#10b981", card: "#dcfce8" },
];

/** Floating particle field — deterministic so SSR/CSR stay in sync. */
const PARTICLES = [
  { left: 8, top: 22, size: 4, dur: 7, delay: 0 },
  { left: 88, top: 30, size: 5, dur: 9, delay: 1.4 },
  { left: 18, top: 74, size: 3, dur: 6, delay: 0.8 },
  { left: 78, top: 66, size: 4, dur: 8, delay: 2.1 },
  { left: 46, top: 12, size: 3, dur: 10, delay: 0.4 },
  { left: 60, top: 84, size: 5, dur: 7.5, delay: 1.9 },
];

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */

export function StoreGalleryHero() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const [tick, setTick] = useState(0);
  const [pinned, setPinned] = useState<DeviceId | null>(null);
  const [dark, setDark] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setTick((n) => n + 1), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const palette = PALETTES[tick % PALETTES.length];
  const autoDevice = DEVICES[Math.floor(tick / 2) % DEVICES.length];
  const device =
    (pinned && DEVICES.find((d) => d.id === pinned)) || autoDevice;

  const controls: { icon: IconType; label: string; active: boolean; onClick: () => void; role: string }[] = [
    ...DEVICES.map((d) => ({
      icon: d.icon,
      label: d.label,
      active: device.id === d.id,
      onClick: () => setPinned(d.id),
      role: "device" as const,
    })),
    {
      icon: Moon,
      label: "Dark mode",
      active: dark,
      onClick: () => setDark((v) => !v),
      role: "theme" as const,
    },
  ];

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-ink-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes sg-shimmer { to { background-position: 200% center; } }
        @keyframes sg-scan { 0% { transform: translateY(-120%); } 100% { transform: translateY(760%); } }
      `}</style>

      {/* ---- Ambient backdrop ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <OceanBackdrop accentHex="#3b82f6" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.5), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />
      <PulseOrb className="left-[6%] top-[18%]" color="#10b981" reduce={!!reduce} />
      <PulseOrb className="right-[8%] bottom-[14%]" color="#3b82f6" reduce={!!reduce} delay={1.4} />

      <div className="container-px relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* ---- Copy column ---- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <Badge tone="light" className="backdrop-blur">
              Store Gallery
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
              Get inspired. Then build yours.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-200 sm:text-xl">
              Every store below was designed to convert and generated with AI.
              Filter by category, preview the experience, and launch a similar
              store in hours.
            </p>

            {/* ---- Interactive device-feature chips ---- */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {controls.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.onClick}
                  aria-pressed={c.active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
                    c.active
                      ? "border-brand-400/50 bg-brand-500/15 text-white shadow-[0_0_18px_-4px] shadow-brand-500/60"
                      : "border-white/15 bg-white/5 text-ink-200 hover:border-white/25 hover:bg-white/10",
                  )}
                >
                  <c.icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      c.active ? "text-brand-300" : "text-brand-400",
                    )}
                  />
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Tap a device or dark mode to preview the mockup live.
            </p>
          </motion.div>

          {/* ---- Animated showcase column ---- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="relative flex items-center justify-center"
          >
            {/* Floating particles */}
            {!reduce && (
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {PARTICLES.map((p, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      width: p.size,
                      height: p.size,
                      background: i % 2 ? "#3b82f6" : "#10b981",
                      boxShadow: `0 0 8px ${i % 2 ? "#3b82f6" : "#10b981"}`,
                    }}
                    animate={{ y: [0, -22, 0], opacity: [0.2, 0.9, 0.2] }}
                    transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
              </div>
            )}

            <MockupStage
              device={device}
              palette={palette}
              dark={dark}
              reduce={!!reduce}
            />
          </motion.div>
        </div>

        {/* ---- Palette progress dots ---- */}
        <div className="mt-12 flex items-center justify-center gap-3">
          {PALETTES.map((p, i) => {
            const active = p.id === palette.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTick(i)}
                aria-label={`Show ${p.name} storefront`}
                aria-current={active}
                className="relative h-2.5 overflow-hidden rounded-full transition-all duration-300"
                style={{
                  width: active ? 40 : 10,
                  background: active ? `${p.accent}44` : "rgba(255,255,255,0.22)",
                }}
              >
                {active && (
                  <motion.span
                    key={`${tick}-${paused}-${reduce}`}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: p.accent }}
                    initial={{ width: "0%" }}
                    animate={{ width: paused || reduce ? "100%" : ["0%", "100%"] }}
                    transition={{ duration: paused || reduce ? 0.3 : AUTO_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pulsing gradient orb with ring                                    */
/* ------------------------------------------------------------------ */

function PulseOrb({
  className,
  color,
  reduce,
  delay = 0,
}: {
  className?: string;
  color: string;
  reduce: boolean;
  delay?: number;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute h-40 w-40", className)}>
      <motion.span
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)` }}
        animate={reduce ? {} : { scale: [1, 1.2, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
      />
      {!reduce && (
        <motion.span
          className="absolute inset-6 rounded-full border"
          style={{ borderColor: `${color}66` }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mockup stage — morphing device frame + storefront skeleton        */
/* ------------------------------------------------------------------ */

function MockupStage({
  device,
  palette,
  dark,
  reduce,
}: {
  device: Device;
  palette: Palette;
  dark: boolean;
  reduce: boolean;
}) {
  const spring = { type: "spring" as const, stiffness: 120, damping: 20 };

  return (
    <motion.div
      className="relative w-full"
      animate={{ maxWidth: device.maxW }}
      transition={reduce ? { duration: 0 } : spring}
    >
      {/* AI live badge */}
      <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 lg:left-4 lg:translate-x-0">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-ai-400/40 bg-ink-900/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur"
          style={
            reduce
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(100deg, transparent 20%, rgba(59,130,246,0.35) 50%, transparent 80%), linear-gradient(0deg, rgba(15,23,42,0.8), rgba(15,23,42,0.8))",
                  backgroundSize: "200% 100%, 100% 100%",
                  animation: "sg-shimmer 2.4s linear infinite",
                }
          }
        >
          <Sparkles className="h-3.5 w-3.5 text-ai-300" />
          AI-generated in real time
        </span>
      </div>

      {/* Device frame */}
      <motion.div
        className="relative overflow-hidden border border-white/10 bg-ink-900 shadow-2xl shadow-ink-950/60"
        animate={{ borderRadius: device.chrome === "phone" ? 34 : device.chrome === "tablet" ? 26 : 16 }}
        transition={reduce ? { duration: 0 } : spring}
        style={{ padding: device.chrome === "phone" ? 8 : device.chrome === "tablet" ? 10 : 0 }}
      >
        {/* Browser chrome bar (desktop only) */}
        <AnimatePresence>
          {device.chrome === "browser" && (
            <motion.div
              key="chrome"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 28 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
              className="flex items-center gap-1.5 overflow-hidden bg-ink-800 px-3"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 h-3 flex-1 rounded-full bg-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone notch */}
        {device.chrome === "phone" && (
          <span className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/25" />
        )}

        {/* Screen */}
        <motion.div
          className="relative w-full overflow-hidden"
          animate={{
            aspectRatio: device.aspect,
            borderRadius: device.chrome === "browser" ? 0 : device.chrome === "tablet" ? 16 : 26,
          }}
          transition={reduce ? { duration: 0 } : spring}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${device.id}-${palette.id}-${dark}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
              className="absolute inset-0"
            >
              <Storefront device={device} palette={palette} dark={dark} reduce={reduce} />
            </motion.div>
          </AnimatePresence>

          {/* Generating scan line */}
          {!reduce && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8"
              style={{
                background: `linear-gradient(to bottom, transparent, ${palette.accent}44, transparent)`,
                animation: "sg-scan 3.6s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Storefront skeleton — brand bar + hero banner + product grid      */
/* ------------------------------------------------------------------ */

function Storefront({
  device,
  palette,
  dark,
  reduce,
}: {
  device: Device;
  palette: Palette;
  dark: boolean;
  reduce: boolean;
}) {
  const screenBg = dark ? "#0b1327" : palette.light;
  const line = dark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)";
  const cardImg = dark ? "#1e293b" : palette.card;
  const count = device.cols * 2;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: screenBg }}>
      {/* Brand bar */}
      <div
        className="flex shrink-0 items-center gap-[3%] px-[4%]"
        style={{ height: "13%", background: `linear-gradient(90deg, ${palette.bar[0]}, ${palette.bar[1]})` }}
      >
        <span className="h-[45%] w-[9%] rounded-full bg-white/90" style={{ aspectRatio: 1 }} />
        <span className="h-[16%] w-[10%] rounded-full bg-white/60" />
        <span className="h-[16%] w-[10%] rounded-full bg-white/60" />
        <span className="ml-auto h-[45%] rounded-full bg-white/85" style={{ aspectRatio: 1 }} />
      </div>

      {/* Hero banner */}
      <div
        className="relative mx-[4%] mt-[3%] shrink-0 overflow-hidden rounded-lg"
        style={{ height: "24%", background: `linear-gradient(120deg, ${palette.accent}, ${palette.bar[1]})` }}
      >
        <div className="absolute left-[6%] top-[24%] h-[14%] w-[40%] rounded-full bg-white/85" />
        <div className="absolute left-[6%] top-[46%] h-[12%] w-[28%] rounded-full bg-white/55" />
        <div className="absolute bottom-[16%] left-[6%] h-[20%] w-[24%] rounded-full bg-white" />
      </div>

      {/* Product grid */}
      <div
        className="grid flex-1 content-start gap-[4%] px-[4%] pb-[4%] pt-[3%]"
        style={{ gridTemplateColumns: `repeat(${device.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : 0.05 * i }}
            className="flex flex-col gap-[8%]"
          >
            <div className="w-full rounded-md" style={{ aspectRatio: 1.1, background: cardImg }} />
            <div className="h-[6px] w-[80%] rounded-full" style={{ background: line }} />
            <div className="flex items-center justify-between gap-1">
              <span className="h-[6px] w-[45%] rounded-full" style={{ background: line }} />
              <span
                className="h-[10px] w-[26%] rounded-full"
                style={{ background: palette.accent }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
