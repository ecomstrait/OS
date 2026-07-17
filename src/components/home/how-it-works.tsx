"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Section, SectionHeading } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { howItWorks } from "@/content/process";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 2600;

const KEYFRAMES = `
@keyframes hiw-flow-x {
  0%   { left: 0%;   opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes hiw-flow-y {
  0%   { top: 0%;    opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { top: 100%;  opacity: 0; }
}
@keyframes hiw-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35), 0 0 22px 2px rgba(16,185,129,0.28); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.10), 0 0 40px 6px rgba(16,185,129,0.55); }
}
@keyframes hiw-badge {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.14); }
}
`;

export function HowItWorks({ tone = "muted" }: { tone?: "light" | "muted" | "dark" }) {
  const dark = tone === "dark";
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });

  const n = howItWorks.length;
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);

  // Live, looping auto-advance — paused while the user is interacting.
  useEffect(() => {
    if (reduce || !inView || interacting) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), STEP_MS);
    return () => clearInterval(t);
  }, [reduce, inView, interacting, n]);

  const activate = (i: number) => {
    setActive(i);
    setInteracting(true);
  };

  // Reduced motion: show the whole track as complete and skip pulses.
  const fill = reduce ? 1 : active / (n - 1);

  return (
    <Section tone={tone}>
      <SectionHeading
        invert={dark}
        eyebrow="How It Works"
        title="From supplier shelf to selling online in five steps"
        description="A single, guided journey — no developers, no agencies, no guesswork."
      />

      <div
        ref={ref}
        onMouseLeave={() => setInteracting(false)}
        className="relative mt-16"
      >
        <style>{KEYFRAMES}</style>

        {/* ---- Connector: horizontal rail (desktop) ---- */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[10%] right-[10%] top-7 hidden -translate-y-1/2 md:block"
        >
          <div className={cn("relative h-[3px] w-full rounded-full", dark ? "bg-white/15" : "bg-ink-200/70")}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              initial={false}
              animate={{ width: `${fill * 100}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            {!reduce && (
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_3px_rgba(16,185,129,0.7)]"
                style={{ animation: "hiw-flow-x 3.2s linear infinite" }}
              />
            )}
          </div>
        </div>

        {/* ---- Connector: vertical rail (mobile) ---- */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-7 left-7 top-7 -translate-x-1/2 md:hidden"
        >
          <div className={cn("relative h-full w-[3px] rounded-full", dark ? "bg-white/15" : "bg-ink-200/70")}>
            <motion.div
              className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-brand-500 to-brand-400"
              initial={false}
              animate={{ height: `${fill * 100}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            {!reduce && (
              <span
                className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_3px_rgba(16,185,129,0.7)]"
                style={{ animation: "hiw-flow-y 3.2s linear infinite" }}
              />
            )}
          </div>
        </div>

        {/* ---- Steps ---- */}
        <ol className="relative grid gap-8 md:grid-cols-5 md:gap-6">
          {howItWorks.map((step, i) => {
            const isActive = active === i;
            return (
              <motion.li
                key={step.title}
                onMouseEnter={() => activate(i)}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
              >
                <button
                  type="button"
                  onClick={() => activate(i)}
                  onFocus={() => activate(i)}
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  aria-pressed={isActive}
                  className="relative z-10 shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
                >
                  <motion.span
                    className={cn(
                      "relative grid h-14 w-14 place-items-center rounded-2xl ring-1 transition-colors duration-300",
                      dark ? "bg-white/10" : "bg-white",
                      isActive
                        ? (dark ? "ring-brand-400/50" : "ring-brand-200")
                        : (dark ? "ring-white/15" : "ring-ink-100 shadow-sm shadow-ink-950/5"),
                    )}
                    animate={reduce ? undefined : { scale: isActive ? 1.08 : 1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    style={
                      isActive && !reduce
                        ? { animation: "hiw-glow 2.2s ease-in-out infinite" }
                        : undefined
                    }
                  >
                    <Icon
                      name={step.icon}
                      className={cn(
                        "h-6 w-6 transition-colors duration-300",
                        isActive ? (dark ? "text-brand-400" : "text-brand-600") : (dark ? "text-white/50" : "text-ink-400"),
                      )}
                    />
                    <span
                      className={cn(
                        "absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white transition-colors duration-300",
                        isActive ? "bg-brand-500" : (dark ? "bg-white/25" : "bg-ink-900"),
                      )}
                      style={
                        isActive && !reduce
                          ? { animation: "hiw-badge 2.2s ease-in-out infinite" }
                          : undefined
                      }
                    >
                      {i + 1}
                    </span>
                  </motion.span>
                </button>

                <div className="md:mt-5">
                  <h3
                    className={cn(
                      "text-base font-bold transition-colors duration-300",
                      dark ? "text-white" : (isActive ? "text-ink-950" : "text-ink-900"),
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-white/60" : "text-ink-500")}>
                    {step.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
