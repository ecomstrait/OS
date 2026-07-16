"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const alternatives = [
  { name: "Shopify", pros: ["Great for building stores"], cons: ["No supplier marketplace", "No AI consultant", "No supplier onboarding"] },
  { name: "Agencies", pros: ["Custom websites"], cons: ["Expensive", "Slow delivery", "Limited ongoing support"] },
  { name: "Alibaba", pros: ["Large supplier network"], cons: ["No website creation", "No automation", "No AI"] },
  { name: "Dropshipping apps", pros: ["Easy product sourcing"], cons: ["Weak branding", "Little intelligence", "Limited customization"] },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WhyLandscape() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Section tone="light">
      <SectionHeading
        eyebrow="The Landscape"
        title="Most platforms solve only one problem"
        description="Each tool does part of the job. You're left stitching them together — and paying for all of them."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {alternatives.map((alt, i) => {
          const active = hovered === i;
          const dimmed = hovered !== null && !active;
          return (
            <motion.div
              key={alt.name}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              animate={{ scale: active ? 1.03 : 1, opacity: dimmed ? 0.6 : 1 }}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-white p-6 transition-colors duration-200",
                active
                  ? "border-brand-300 shadow-xl shadow-brand-500/10"
                  : "border-ink-100",
              )}
            >
              <h3 className="text-lg font-bold text-ink-950">{alt.name}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {alt.pros.map((p, pi) => (
                  <li key={p} className="flex items-center gap-2 text-ink-700">
                    <DrawMark
                      kind="check"
                      delay={0.2 + i * 0.1 + pi * 0.08}
                      reduce={!!reduce}
                    />
                    {p}
                  </li>
                ))}
                {alt.cons.map((c, ci) => (
                  <li key={c} className="flex items-center gap-2 text-ink-400">
                    <DrawMark
                      kind="cross"
                      delay={0.3 + i * 0.1 + ci * 0.08}
                      reduce={!!reduce}
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* A check or cross that draws itself in on scroll. */
function DrawMark({
  kind,
  delay,
  reduce,
}: {
  kind: "check" | "cross";
  delay: number;
  reduce: boolean;
}) {
  const isCheck = kind === "check";
  const paths = isCheck ? ["M5 13l4 4L19 7"] : ["M6 6l12 12", "M18 6L6 18"];
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0", isCheck ? "text-brand-500" : "text-red-400")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, delay: delay + i * 0.12, ease: EASE }}
        />
      ))}
    </svg>
  );
}
