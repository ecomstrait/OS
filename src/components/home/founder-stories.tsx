"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { founderStories } from "@/content/founder-stories";
import { cn } from "@/lib/utils";

const AUTO_MS = 7000;
const EASE = [0.22, 1, 0.36, 1] as const;

export function FounderStories() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = founderStories.length;
  const active = founderStories[index];

  const select = useCallback((i: number) => {
    setIndex(((i % count) + count) % count);
    setPaused(true);
  }, [count]);

  // Auto-advance through founders while in view and not interacting.
  useEffect(() => {
    if (paused || reduce || !inView) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, reduce, inView, count]);

  return (
    <Section tone="dark" id="stories">
      <SectionHeading
        invert
        eyebrow="Founder Stories"
        title="From idea to income — the founder's journey"
        description="Watch how a founder goes from a single sentence to a live business with EcomAI. Illustrative examples — figures are simulated, not live customer data."
      />

      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[300px_1fr]"
      >
        {/* ---- Founder selector ---- */}
        <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {founderStories.map((s, i) => {
            const isActive = i === index;
            return (
              <button
                key={s.name}
                onClick={() => select(i)}
                aria-pressed={isActive}
                className={cn(
                  "flex min-w-[220px] shrink-0 items-center gap-3 rounded-2xl border p-3 text-left transition-colors lg:min-w-0",
                  isActive
                    ? "border-ai-400/60 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]",
                )}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ai-500/30 to-brand-500/30 text-lg">
                  {s.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{s.name}</span>
                  <span className="block truncate text-[11px] text-white/50">{s.niche}</span>
                </span>
                {isActive && !reduce && inView && !paused && (
                  <motion.span
                    key={index}
                    className="ml-auto hidden h-1.5 w-8 shrink-0 overflow-hidden rounded-full bg-white/15 lg:block"
                  >
                    <motion.span
                      className="block h-full rounded-full bg-ai-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                    />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---- Journey ---- */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950/50 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* header */}
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ai-500 to-brand-600 text-xl shadow-lg">
                  {active.emoji}
                </span>
                <div>
                  <p className="text-base font-bold text-white">{active.name}</p>
                  <p className="text-xs text-white/55">{active.summary}</p>
                </div>
              </div>

              {/* beats timeline */}
              <ol className="relative mt-7 space-y-5 border-l border-white/10 pl-6">
                {active.beats.map((b, i) => (
                  <motion.li
                    key={`${active.name}-${i}`}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : 0.15 + i * 0.22, duration: 0.4, ease: EASE }}
                    className="relative"
                  >
                    <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-ink-900 ring-2 ring-ai-500/40">
                      <Icon name={b.icon} className="h-3.5 w-3.5 text-ai-300" />
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ai-300">{b.when}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/80">{b.label}</p>
                  </motion.li>
                ))}
              </ol>

              {/* result */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.15 + active.beats.length * 0.22, duration: 0.45, ease: EASE }}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
                  <Icon name="TrendingUp" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{active.result}</p>
                  <p className="text-[10px] text-white/45">Illustrative example — simulated preview, not live data.</p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Button href="/#builder" variant="ai" size="md">
          Start your story <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Section>
  );
}
