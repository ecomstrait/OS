"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionHeading } from "@/components/ui/section";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const differentiators: { icon: IconName; title: string }[] = [
  // AI Website Builder — hidden from the site for now, not removed.
  // { icon: "Wand2", title: "AI Website Builder" },
  { icon: "Bot", title: "AI Business Consultant" },
  { icon: "Boxes", title: "Supplier Marketplace" },
  { icon: "Rocket", title: "Store Launch Service" },
  { icon: "Eye", title: "Live Website Preview" },
  { icon: "Package", title: "Inventory Management" },
  { icon: "BarChart3", title: "Analytics Dashboard" },
  { icon: "Search", title: "SEO Automation" },
  { icon: "MessageSquare", title: "Marketing Assistant" },
  { icon: "FileText", title: "Product Management" },
  { icon: "Lightbulb", title: "Business Insights" },
  { icon: "Layers", title: "White-label Ready" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WhyDifferentiators() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Section tone="dark">
      <style>{`
        @keyframes why-diff-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
      <SectionHeading
        invert
        eyebrow="Why We're Different"
        title="One platform. Everything you need."
        description="Stop managing ten different tools. Run your entire business from one intelligent system."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((d, i) => {
          const active = hovered === i;
          return (
            <motion.div
              key={d.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.12 + Math.floor(i / 3) * 0.06, ease: EASE }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white p-4 transition-all duration-200",
                active
                  ? "border-brand-300 shadow-lg shadow-brand-500/10"
                  : "border-ink-100",
              )}
            >
              {/* continuous shimmer sweeping across the tile keeps the grid alive */}
              {!reduce && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(100deg, transparent 35%, rgba(16,185,129,0.10) 50%, transparent 65%)",
                    animation: "why-diff-sweep 4.5s ease-in-out infinite",
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors duration-200",
                  active ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600",
                )}
              >
                <Icon name={d.icon} className="h-5 w-5" />
              </span>
              <span className="relative z-10 text-sm font-semibold text-ink-900">{d.title}</span>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
