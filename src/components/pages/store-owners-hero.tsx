"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence, motion, useInView, useReducedMotion,
} from "framer-motion";
import { ArrowRight, Images, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Theme = {
  id: string;
  label: string;
  accent: string;
  accentDeep: string;
  prompt: string;
  domain: string;
  swatches: string[];
};

const THEMES: Theme[] = [
  {
    id: "cosmetics",
    label: "Cosmetics",
    accent: "#10b981",
    accentDeep: "#047857",
    prompt: "Build me a modern cosmetics store…",
    domain: "glow-cosmetics.store",
    swatches: ["#f9a8d4", "#fbcfe8", "#c4b5fd", "#fca5a5", "#fdba74", "#f9a8d4"],
  },
  {
    id: "sportswear",
    label: "Sportswear",
    accent: "#3b82f6",
    accentDeep: "#1d4ed8",
    prompt: "Build me a bold sportswear store…",
    domain: "peak-athletics.store",
    swatches: ["#93c5fd", "#60a5fa", "#a5b4fc", "#38bdf8", "#818cf8", "#93c5fd"],
  },
  {
    id: "decor",
    label: "Home Decor",
    accent: "#10b981",
    accentDeep: "#0f766e",
    prompt: "Build me a cozy home decor store…",
    domain: "nest-and-co.store",
    swatches: ["#6ee7b7", "#a7f3d0", "#fcd34d", "#fdba74", "#5eead4", "#6ee7b7"],
  },
];

/** Total build steps: 0 skeleton · 1 brand bar · 2 hero banner · 3-8 products. */
const PRODUCTS = 6;
const MAX_STEP = 2 + PRODUCTS;

export function StoreOwnersHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  const [themeIndex, setThemeIndex] = useState(0);
  const [step, setStep] = useState(reduce ? MAX_STEP : 0);
  const theme = THEMES[themeIndex];

  // Continuously (re)assemble the storefront in a loop.
  useEffect(() => {
    if (reduce) return;
    if (!inView) return;
    const id = setInterval(() => {
      setStep((s) => (s >= MAX_STEP ? 0 : s + 1));
    }, 700);
    return () => clearInterval(id);
  }, [reduce, inView, themeIndex]);

  const brandVisible = step >= 1;
  const bannerVisible = step >= 2;
  const productsVisible = Math.max(0, Math.min(PRODUCTS, step - 2));

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink-950 text-white"
    >
      <style>{`@keyframes so-hero-dash { to { stroke-dashoffset: -28; } }`}</style>

      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <OceanBackdrop accentHex="#3b82f6" />
      <motion.div
        aria-hidden
        key={theme.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${theme.accent}66, ${theme.accentDeep}33, transparent 70%)` }}
      />
      {!reduce && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full opacity-30 blur-3xl animate-aurora"
          style={{ background: `radial-gradient(circle, ${theme.accent}55, transparent 65%)` }}
        />
      )}

      <div className="container-px relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ---- Copy ---- */}
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              For Store Owners
            </motion.span>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
              className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
            >
              Launch your online store with{" "}
              <span className="text-gradient">AI</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
              className="mt-5 text-lg text-ink-200 sm:text-xl"
            >
              Pick your products, describe your brand, and watch EcomAI build a professional store you can preview live and deploy in hours — no inventory to hold.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
              className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button href="/#builder" variant="primary" size="lg">
                Build My Business <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/#builder" variant="outline-light" size="lg">
                <Images className="h-4 w-4" /> Watch AI build a business
              </Button>
            </motion.div>

            {/* theme picker — user interaction */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: EASE }}
              className="mt-8"
            >
              <p className="text-xs font-medium text-white/45">Try building a different store:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2.5 lg:justify-start">
                {THEMES.map((t, i) => {
                  const active = i === themeIndex;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setThemeIndex(i);
                        setStep(reduce ? MAX_STEP : 0);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
                        active
                          ? "border-transparent text-white shadow-lg"
                          : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                      )}
                      style={active ? { background: t.accent, boxShadow: `0 10px 30px -8px ${t.accent}aa` } : undefined}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ---- Live builder visual ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="relative mx-auto w-full max-w-xl"
          >
            <BuilderBeams accent={theme.accent} reduce={!!reduce} />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-ink-900/70 shadow-2xl shadow-black/40 backdrop-blur">
              {/* browser chrome */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/70" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: theme.accent }} />
                  <span className="truncate text-xs text-white/50">{theme.domain}</span>
                </div>
              </div>

              {/* EcomAI prompt line */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-ink-950/40 px-4 py-3">
                <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${theme.accent}, ${theme.accentDeep})`, boxShadow: `0 0 18px ${theme.accent}88` }}
                >
                  {!reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-lg"
                      animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      style={{ background: `${theme.accent}55` }}
                    />
                  )}
                  <Sparkles className="relative h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">EcomAI is building</p>
                  <p className="mt-0.5 truncate text-sm text-white/85">
                    <TypedPrompt key={theme.id} text={theme.prompt} reduce={!!reduce} accent={theme.accent} />
                  </p>
                </div>
              </div>

              {/* store canvas */}
              <div className="relative aspect-[4/3] overflow-hidden bg-white p-4">
                {/* brand bar */}
                <AnimatePresence>
                  {brandVisible && (
                    <motion.div
                      key="brand"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: `${theme.accent}14` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-md text-white" style={{ background: theme.accent }}>
                          <ShoppingBag className="h-3 w-3" />
                        </span>
                        <span className="h-2.5 w-16 rounded-full" style={{ background: theme.accent }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-2 w-8 rounded-full bg-ink-200" />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* hero banner */}
                <div className="mt-3 h-[22%] overflow-hidden rounded-xl">
                  <AnimatePresence>
                    {bannerVisible ? (
                      <motion.div
                        key="banner"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="flex h-full items-center px-4"
                        style={{ background: `linear-gradient(120deg, ${theme.accent}, ${theme.accentDeep})` }}
                      >
                        <div className="space-y-1.5">
                          <span className="block h-2 w-24 rounded-full bg-white/80" />
                          <span className="block h-2 w-16 rounded-full bg-white/50" />
                        </div>
                      </motion.div>
                    ) : (
                      <div key="banner-skel" className="h-full w-full animate-pulse rounded-xl bg-ink-100" />
                    )}
                  </AnimatePresence>
                </div>

                {/* product grid */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {theme.swatches.map((sw, i) => {
                    const filled = i < productsVisible;
                    return (
                      <div key={i} className="overflow-hidden rounded-xl">
                        <AnimatePresence mode="wait">
                          {filled ? (
                            <motion.div
                              key="card"
                              initial={{ opacity: 0, scale: 0.8, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.35, ease: EASE }}
                            >
                              <div className="aspect-square w-full rounded-lg" style={{ background: `linear-gradient(140deg, ${sw}, ${sw}bb)` }} />
                              <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-ink-200" />
                              <span className="mt-1 block h-1.5 w-1/2 rounded-full" style={{ background: `${theme.accent}99` }} />
                            </motion.div>
                          ) : (
                            <div key="skel">
                              <div className="aspect-square w-full animate-pulse rounded-lg bg-ink-100" />
                              <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-ink-100" />
                              <span className="mt-1 block h-1.5 w-1/2 rounded-full bg-ink-100" />
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* building shimmer overlay */}
                {!reduce && productsVisible < PRODUCTS && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    animate={{ opacity: [0.08, 0.18, 0.08] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ background: `linear-gradient(180deg, transparent, ${theme.accent}22)` }}
                  />
                )}
              </div>

              {/* status footer */}
              <div className="flex items-center justify-between border-t border-white/10 bg-ink-950/40 px-4 py-2.5">
                <span className="flex items-center gap-2 text-[11px] text-white/55">
                  {!reduce && (
                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: theme.accent }}
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </span>
                  )}
                  {productsVisible >= PRODUCTS ? "Store ready to preview" : "Assembling your storefront…"}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: theme.accent }}>
                  {Math.min(100, Math.round((step / MAX_STEP) * 100))}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Typed prompt line — remounts per theme (key) so state resets clean */
/* ------------------------------------------------------------------ */

function TypedPrompt({ text, reduce, accent }: { text: string; reduce: boolean; accent: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(() => setCount(text.length), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [text, reduce]);

  const done = count >= text.length;

  return (
    <span>
      {text.slice(0, count)}
      {!reduce && !done && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 rounded-full"
          style={{ background: accent }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Flowing particles feeding the builder                             */
/* ------------------------------------------------------------------ */

const BUILDER_BEAMS = [
  "M 40 40 C 160 20, 300 90, 420 60",
  "M 30 120 C 160 150, 300 60, 430 130",
  "M 45 200 C 170 180, 300 240, 425 200",
].map((d, i) => ({ id: `so-hero-beam-${i}`, d }));

function BuilderBeams({ accent, reduce }: { accent: string; reduce: boolean }) {
  if (reduce) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 460 240"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] opacity-70"
    >
      <defs>
        <linearGradient id="so-hero-beam-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.04" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {BUILDER_BEAMS.map((b) => (
        <path
          key={b.id}
          id={b.id}
          d={b.d}
          fill="none"
          stroke="url(#so-hero-beam-fade)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="2 12"
          style={{ animation: "so-hero-dash 1.4s linear infinite" }}
        />
      ))}
      {BUILDER_BEAMS.map((b, i) => (
        <circle key={`pkt-${b.id}`} r={2.6} fill={accent} opacity={0.95}>
          <animateMotion
            dur={`${2.6 + (i % 3) * 0.5}s`}
            begin={`-${i * 0.6}s`}
            repeatCount="indefinite"
            keyPoints="0;1"
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
