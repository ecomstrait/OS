"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { services, type ServiceCategory } from "@/content/services";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type CategoryKey = "all" | ServiceCategory;

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "build", label: "Build" },
  { key: "sell", label: "Sell" },
  { key: "automate", label: "Automate" },
  { key: "grow", label: "Grow" },
];

type Accent = {
  hex: string;
  border: string;
  tile: string;
  grad: string;
  check: string;
  dot: string;
  divider: string;
};

const ACCENTS: Accent[] = [
  {
    hex: "#10b981",
    border: "#6ee7b7",
    tile: "bg-brand-50 text-brand-600",
    grad: "from-brand-500 to-brand-400",
    check: "text-brand-500",
    dot: "bg-brand-400",
    divider: "via-brand-200",
  },
  {
    hex: "#3b82f6",
    border: "#93c5fd",
    tile: "bg-ai-50 text-ai-600",
    grad: "from-ai-500 to-ai-400",
    check: "text-ai-500",
    dot: "bg-ai-400",
    divider: "via-ai-200",
  },
];

export function ServicesExplorer() {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<CategoryKey>("all");

  const items = useMemo(() => {
    const withIndex = services.map((service, index) => ({ service, index }));
    if (category === "all") return withIndex;
    return withIndex.filter(({ service }) => service.category === category);
  }, [category]);

  return (
    <>
      <SectionHeading eyebrow="What we do" title="Explore the platform" />

      {/* ---- Category tabs (user interaction) ---- */}
      <div className="mt-10 flex flex-wrap justify-center gap-2.5">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={isActive}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                isActive ? "text-white" : "text-ink-600 hover:text-ink-950",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="services-tab-pill"
                  className="absolute inset-0 rounded-full bg-ink-950"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ---- Filtered, animated grid ---- */}
      <motion.div
        layout={!reduce}
        className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {items.map(({ service, index }) => (
            <ServiceCard
              key={service.title}
              service={service}
              accent={ACCENTS[index % 2]}
              reduce={!!reduce}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function ServiceCard({
  service,
  accent,
  reduce,
}: {
  service: (typeof services)[number];
  accent: Accent;
  reduce: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      whileHover={
        reduce
          ? undefined
          : { y: -6, borderColor: accent.border, boxShadow: `0 20px 45px -14px ${accent.hex}66` }
      }
      className="group relative flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6"
    >
      {/* Live status dot */}
      <motion.span
        aria-hidden
        className={cn("absolute right-5 top-5 h-2 w-2 rounded-full", accent.dot)}
        animate={reduce ? { opacity: 0.5 } : { opacity: [0.25, 1, 0.25], scale: [1, 1.3, 1] }}
        transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <span
        className={cn(
          "relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl transition-colors duration-300 group-hover:text-white",
          accent.tile,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            accent.grad,
          )}
        />
        <Icon
          name={service.icon}
          className="relative h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6"
        />
      </span>

      <h3 className="mt-5 text-lg font-bold text-ink-950">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{service.description}</p>

      {/* Features reveal on hover / focus */}
      <AnimatePresence initial={false}>
        {hovered && (
          <motion.div
            key="features"
            className="overflow-hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
          >
            <div className="pt-4">
              <span
                aria-hidden
                className={cn(
                  "mb-3 block h-px w-full bg-gradient-to-r from-transparent to-transparent",
                  accent.divider,
                )}
              />
              <ul className="grid grid-cols-2 gap-1.5">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-600">
                    <Check className={cn("h-3 w-3 shrink-0", accent.check)} strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
