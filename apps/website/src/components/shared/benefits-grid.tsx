"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Benefit = { icon: IconName; title: string; description: string };

const EASE = [0.22, 1, 0.36, 1] as const;

export function BenefitsGrid({ items }: { items: Benefit[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <style>{`
        @keyframes bg-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
      {items.map((b, i) => {
        const isAi = i % 2 === 1;
        return (
          <motion.div
            key={b.title}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: EASE }}
            whileHover={reduce ? undefined : { y: -4 }}
            className={cn(
              "group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 transition-shadow duration-300 hover:shadow-xl hover:shadow-ink-950/5",
              isAi ? "hover:border-ai-200" : "hover:border-brand-200",
            )}
          >
            {/* icon tile with a continuous shimmer sweep */}
            <span
              className={cn(
                "relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl transition-colors duration-300",
                isAi
                  ? "bg-ai-50 text-ai-600 group-hover:bg-ai-500 group-hover:text-white"
                  : "bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
              )}
            >
              {!reduce && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
                    backgroundSize: "200% 100%",
                    animation: "bg-shimmer 3.5s linear infinite",
                    animationDelay: `${(i % 6) * 0.4}s`,
                  }}
                />
              )}
              <motion.span
                animate={reduce ? {} : { y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: (i % 4) * 0.3 }}
                className="relative"
              >
                <Icon name={b.icon} className="h-5 w-5" />
              </motion.span>
            </span>
            <h3 className="text-base font-bold text-ink-950">{b.title}</h3>
            <p className="text-sm leading-relaxed text-ink-500">{b.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
