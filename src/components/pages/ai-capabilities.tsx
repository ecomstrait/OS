"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section, SectionHeading } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { aiFeatures } from "@/content/ai";

type Filter = "all" | "live" | "soon";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "soon", label: "Soon" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function AiCapabilities() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () =>
      aiFeatures.filter((f) =>
        filter === "all" ? true : (f.status ?? "live") === filter,
      ),
    [filter],
  );

  return (
    <Section tone="light">
      <style>{`
        @keyframes aicap-shine {
          0% { transform: translateX(-120%); }
          60%, 100% { transform: translateX(220%); }
        }
      `}</style>

      <SectionHeading
        eyebrow="Capabilities"
        title="One AI, many jobs"
        description="Every capability is designed to remove manual work and help you make better decisions, faster."
      />

      {/* filter toggle */}
      <div className="mt-10 flex justify-center">
        <div
          role="tablist"
          aria-label="Filter capabilities by status"
          className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 p-1"
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  isActive ? "text-white" : "text-ink-500 hover:text-ink-800",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="aicap-pill"
                    className="absolute inset-0 rounded-full bg-ink-950"
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        layout
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((f, i) => {
            const isLive = (f.status ?? "live") === "live";
            return (
              <motion.div
                key={f.title}
                layout
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.05, ease: EASE }}
                whileHover={reduce ? undefined : { y: -6 }}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 transition-shadow hover:border-ai-200 hover:shadow-xl hover:shadow-ink-950/5"
              >
                {/* accent glow on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ai-400/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative flex items-center justify-between">
                  <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-ai-50 text-ai-600 transition group-hover:bg-ai-500 group-hover:text-white">
                    <Icon name={f.icon} className="relative z-10 h-6 w-6" />
                    {/* index-staggered shimmer sweep */}
                    {!reduce && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 w-1/2 -skew-x-12 bg-white/40"
                        style={{
                          animation: "aicap-shine 3.2s ease-in-out infinite",
                          animationDelay: `${(i % 6) * 0.35}s`,
                        }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      isLive
                        ? "bg-brand-50 text-brand-600"
                        : "bg-ink-100 text-ink-500",
                    )}
                  >
                    {isLive ? "Live" : "Soon"}
                  </span>
                </div>
                <h3 className="relative mt-5 text-lg font-bold text-ink-950">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-ink-500">{f.description}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}
