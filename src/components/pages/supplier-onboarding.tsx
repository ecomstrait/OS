"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ClipboardList, ShieldCheck, PackagePlus, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 2800;

const STEPS: { icon: IconType; step: string; detail: string }[] = [
  { icon: ClipboardList, step: "Register", detail: "Tell us about your business and catalog." },
  { icon: ShieldCheck, step: "Get verified", detail: "Our team reviews and verifies you — usually within a few days." },
  { icon: PackagePlus, step: "Publish products", detail: "Upload your catalog; AI enriches every listing." },
  { icon: BellRing, step: "Start receiving orders", detail: "Store owners sell your products; orders route to you automatically." },
];

const KEYFRAMES = `
@keyframes sup-onb-flow-x {
  0%   { left: 0%;   opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes sup-onb-flow-y {
  0%   { top: 0%;   opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes sup-onb-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35), 0 0 22px 2px rgba(16,185,129,0.28); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.10), 0 0 40px 6px rgba(16,185,129,0.55); }
}
@keyframes sup-onb-badge {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.14); }
}
`;

export function SupplierOnboarding() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });

  const n = STEPS.length;
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);

  // Live auto-advance, paused while the user is interacting.
  useEffect(() => {
    if (reduce || !inView || interacting) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), STEP_MS);
    return () => clearInterval(t);
  }, [reduce, inView, interacting, n]);

  const activate = (i: number) => {
    setActive(i);
    setInteracting(true);
  };

  const fill = reduce ? 1 : active / (n - 1);

  return (
    <div ref={ref} onMouseLeave={() => setInteracting(false)} className="relative mt-14">
      <style>{KEYFRAMES}</style>

      {/* ---- Connector: horizontal rail (desktop) ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden -translate-y-1/2 md:block"
      >
        <div className="relative h-[3px] w-full rounded-full bg-ink-200/70">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
            initial={false}
            animate={{ width: `${fill * 100}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          {!reduce && (
            <span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_3px_rgba(16,185,129,0.7)]"
              style={{ animation: "sup-onb-flow-x 3.2s linear infinite" }}
            />
          )}
        </div>
      </div>

      {/* ---- Connector: vertical rail (mobile) ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-7 left-7 top-7 -translate-x-1/2 md:hidden"
      >
        <div className="relative h-full w-[3px] rounded-full bg-ink-200/70">
          <motion.div
            className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-brand-500 to-brand-400"
            initial={false}
            animate={{ height: `${fill * 100}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          {!reduce && (
            <span
              className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_3px_rgba(16,185,129,0.7)]"
              style={{ animation: "sup-onb-flow-y 3.2s linear infinite" }}
            />
          )}
        </div>
      </div>

      {/* ---- Steps ---- */}
      <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
        {STEPS.map((s, i) => {
          const isActive = active === i;
          return (
            <motion.li
              key={s.step}
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
                aria-label={`Step ${i + 1}: ${s.step}`}
                aria-pressed={isActive}
                className="relative z-10 shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
              >
                <motion.span
                  className={cn(
                    "relative grid h-14 w-14 place-items-center rounded-2xl bg-white ring-1 transition-colors duration-300",
                    isActive ? "ring-brand-200" : "ring-ink-100 shadow-sm shadow-ink-950/5",
                  )}
                  animate={reduce ? undefined : { scale: isActive ? 1.08 : 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  style={
                    isActive && !reduce
                      ? { animation: "sup-onb-glow 2.2s ease-in-out infinite" }
                      : undefined
                  }
                >
                  <s.icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      isActive ? "text-brand-600" : "text-ink-400",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white transition-colors duration-300",
                      isActive ? "bg-brand-500" : "bg-ink-900",
                    )}
                    style={
                      isActive && !reduce
                        ? { animation: "sup-onb-badge 2.2s ease-in-out infinite" }
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
                    isActive ? "text-ink-950" : "text-ink-900",
                  )}
                >
                  {s.step}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.detail}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
