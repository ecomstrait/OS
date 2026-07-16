"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const notForYou = [
  "You only need a basic brochure website.",
  "You already run a mature, deeply-customized enterprise commerce stack.",
  "You'd rather do every task manually without AI assistance.",
  "You're not planning to sell products online.",
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WhyFit() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Section tone="light">
      <div className="grid gap-10 lg:grid-cols-2">
        <SectionHeading
          align="left"
          eyebrow="Honest Fit"
          title="EcomStrait isn't for everyone — and that's okay"
          description="We're built for businesses that want to move faster, automate smarter, and scale confidently. If that's not you, another tool may fit better."
        />
        <div>
          <ul className="space-y-3">
            {notForYou.map((n, i) => {
              const active = hovered === i;
              return (
                <motion.li
                  key={n}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-sm transition-colors duration-200",
                    active
                      ? "border-ink-300 bg-white text-ink-700 shadow-md shadow-ink-950/5"
                      : "border-ink-100 bg-ink-50/60 text-ink-600",
                  )}
                >
                  <motion.span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors duration-200",
                      active ? "bg-ink-200 text-ink-600" : "bg-ink-100 text-ink-400",
                    )}
                    animate={reduce ? {} : { rotate: active ? [0, -12, 12, 0] : 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </motion.span>
                  {n}
                </motion.li>
              );
            })}
          </ul>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            className="mt-6"
          >
            <Button href="/store-owners" variant="primary" size="md">
              Sounds like us — let&apos;s go <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
