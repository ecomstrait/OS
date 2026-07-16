"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { services, type Service } from "@/content/services";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Accent = {
  key: "brand" | "ai";
  hex: string;
  border: string;
  tile: string;
  grad: string;
  check: string;
  dot: string;
  divider: string;
};

/** Alternate the hero's dual accent (emerald / electric blue) by index. */
const ACCENTS: Record<"brand" | "ai", Accent> = {
  brand: {
    key: "brand",
    hex: "#10b981",
    border: "#6ee7b7",
    tile: "bg-brand-50 text-brand-600",
    grad: "from-brand-500 to-brand-400",
    check: "text-brand-500",
    dot: "bg-brand-400",
    divider: "via-brand-200",
  },
  ai: {
    key: "ai",
    hex: "#3b82f6",
    border: "#93c5fd",
    tile: "bg-ai-50 text-ai-600",
    grad: "from-ai-500 to-ai-400",
    check: "text-ai-500",
    dot: "bg-ai-400",
    divider: "via-ai-200",
  },
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

function FeatureList({
  features,
  accent,
  reduce,
  immediate,
}: {
  features: string[];
  accent: Accent;
  reduce: boolean;
  immediate: boolean;
}) {
  return (
    <div>
      <span
        aria-hidden
        className={cn(
          "mb-3 block h-px w-full bg-gradient-to-r from-transparent to-transparent",
          accent.divider,
        )}
      />
      <motion.ul
        className="grid grid-cols-2 gap-1.5"
        variants={listVariants}
        initial={reduce ? false : "hidden"}
        {...(immediate
          ? { animate: "show" as const }
          : { whileInView: "show" as const, viewport: { once: false, margin: "-40px" } })}
      >
        {features.map((f) => (
          <motion.li
            key={f}
            variants={itemVariants}
            className="flex items-center gap-1.5 text-xs text-ink-600"
          >
            <Check className={cn("h-3 w-3 shrink-0", accent.check)} strokeWidth={3} />
            {f}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function ServiceCard({
  service,
  index,
  detailed,
  reduce,
}: {
  service: Service;
  index: number;
  detailed: boolean;
  reduce: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = index % 2 === 0 ? ACCENTS.brand : ACCENTS.ai;
  const showFeatures = detailed || hovered;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.09, ease: EASE }}
      whileHover={
        reduce
          ? undefined
          : { y: -6, borderColor: accent.border, boxShadow: `0 20px 45px -14px ${accent.hex}66` }
      }
      className="group relative flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6"
    >
      {/* Live status dot — gentle pulse, staggered so the grid breathes like a system */}
      <motion.span
        aria-hidden
        className={cn("absolute right-5 top-5 h-2 w-2 rounded-full", accent.dot)}
        animate={reduce ? { opacity: 0.5 } : { opacity: [0.25, 1, 0.25], scale: [1, 1.3, 1] }}
        transition={
          reduce
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: (index % 6) * 0.35 }
        }
      />

      {/* Icon tile */}
      <span
        className={cn(
          "relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl transition-colors duration-300 group-hover:text-white",
          accent.tile,
        )}
      >
        {/* Hover gradient fill sweep */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            accent.grad,
          )}
        />
        {/* Continuous shimmer sweep — staggered by index */}
        {!reduce && (
          <span
            aria-hidden
            className="sg-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animationDelay: `${(index % 6) * 0.5}s` }}
          />
        )}
        <Icon
          name={service.icon}
          className="relative h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6"
        />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink-950">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{service.description}</p>

      {detailed ? (
        <div className="mt-4">
          <FeatureList features={service.features} accent={accent} reduce={reduce} immediate={false} />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {showFeatures && (
            <motion.div
              key="features"
              className="overflow-hidden"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            >
              <div className="pt-4">
                <FeatureList
                  features={service.features}
                  accent={accent}
                  reduce={!!reduce}
                  immediate
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style>{`
        @keyframes sg-sweep {
          0% { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
          18% { opacity: 0.55; }
          55% { opacity: 0; }
          100% { transform: translateX(130%) skewX(-14deg); opacity: 0; }
        }
        .sg-sweep { animation: sg-sweep 3.4s ease-in-out infinite; }
      `}</style>
    </motion.div>
  );
}

export function ServicesGrid({
  limit,
  detailed = false,
}: {
  limit?: number;
  detailed?: boolean;
}) {
  const reduce = useReducedMotion();
  const items = limit ? services.slice(0, limit) : services;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service, i) => (
        <ServiceCard
          key={service.title}
          service={service}
          index={i}
          detailed={detailed}
          reduce={!!reduce}
        />
      ))}
    </div>
  );
}
