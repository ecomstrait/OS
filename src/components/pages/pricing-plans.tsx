"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Plan = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  featured?: boolean;
};

const plans: Plan[] = [
  { name: "Starter", price: "Coming soon", tagline: "Launch your first store", features: ["AI-built website", "Up to 100 products", "Custom domain", "Standard support"] },
  { name: "Growth", price: "Coming soon", tagline: "Scale with automation", features: ["Everything in Starter", "Unlimited products", "AI marketing & SEO", "Priority support"], featured: true },
  { name: "Agency", price: "Coming soon", tagline: "Launch stores for clients", features: ["Everything in Growth", "White-label", "Multi-store management", "Dedicated manager"] },
];

type Billing = "build" | "monthly";

const BILLING: { id: Billing; label: string; note: string }[] = [
  { id: "build", label: "One-time build", note: "one-time launch fee" },
  { id: "monthly", label: "Monthly platform", note: "billed monthly after launch" },
];

export function PricingPlans() {
  const reduce = useReducedMotion();
  const [billing, setBilling] = useState<Billing>("build");
  const activeNote = BILLING.find((b) => b.id === billing)!.note;

  return (
    <Section tone="muted" id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans, coming soon"
        description="A one-time build plus a monthly platform subscription. Detailed pricing is on the way — book a demo for a tailored quote."
      />

      {/* billing toggle — user interaction */}
      <div className="mt-10 flex justify-center">
        <div className="relative inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-sm">
          {BILLING.map((b) => {
            const active = billing === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBilling(b.id)}
                aria-pressed={active}
                className={cn(
                  "relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200",
                  active ? "text-white" : "text-ink-600 hover:text-ink-900",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand-500 shadow-lg shadow-brand-500/25"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <PlanCard key={plan.name} plan={plan} index={i} note={activeNote} reduce={!!reduce} />
        ))}
      </div>
    </Section>
  );
}

function PlanCard({
  plan,
  index,
  note,
  reduce,
}: {
  plan: Plan;
  index: number;
  note: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
      whileHover={reduce ? undefined : { y: -8 }}
      className={cn(
        "group relative flex h-full flex-col rounded-3xl border p-8 transition-shadow duration-300",
        plan.featured
          ? "border-brand-300 bg-white shadow-2xl shadow-brand-500/10 ring-1 ring-brand-200 hover:shadow-brand-500/25"
          : "border-ink-100 bg-white hover:border-brand-200 hover:shadow-xl hover:shadow-ink-950/5",
      )}
    >
      {/* pulsing "Most popular" highlight */}
      {plan.featured && (
        <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-brand-500"
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <Sparkles className="relative h-3 w-3" />
          <span className="relative">Most popular</span>
        </span>
      )}

      {/* soft glow on hover for the featured card */}
      {plan.featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(16,185,129,0.25), transparent 70%)" }}
        />
      )}

      <h3 className="text-lg font-bold text-ink-950">{plan.name}</h3>
      <p className="text-sm text-ink-500">{plan.tagline}</p>

      <p className="mt-5 text-2xl font-extrabold text-ink-950 font-display">{plan.price}</p>
      <div className="mt-1 h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={note}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="block text-xs font-medium text-brand-600"
          >
            {note}
          </motion.span>
        </AnimatePresence>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f, fi) => (
          <motion.li
            key={f}
            initial={reduce ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.1 + fi * 0.08, ease: EASE }}
            className="flex items-center gap-2.5 text-sm text-ink-600"
          >
            <Check className="h-4 w-4 shrink-0 text-brand-500" strokeWidth={3} /> {f}
          </motion.li>
        ))}
      </ul>

      <div className="mt-8">
        <Button href="#consultation" variant={plan.featured ? "primary" : "outline"} size="md" className="w-full">
          Get notified
        </Button>
      </div>
    </motion.div>
  );
}
