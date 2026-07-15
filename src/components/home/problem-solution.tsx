import {
  Store, Server, Package, Search, Megaphone, CreditCard,
  Headphones, BarChart3, Boxes, ArrowRight,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const fragmentedTools = [
  { icon: Store, label: "Website Builder" },
  { icon: Server, label: "Hosting" },
  { icon: Package, label: "Inventory" },
  { icon: Search, label: "SEO" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Boxes, label: "Suppliers" },
  { icon: CreditCard, label: "Payments" },
  { icon: Headphones, label: "Support" },
  { icon: BarChart3, label: "Analytics" },
];

const unified = [
  "Suppliers", "AI", "Website", "Analytics", "Inventory",
  "Marketing", "Payments", "Orders", "SEO", "Customers",
];

export function ProblemSolution() {
  return (
    <Section tone="light">
      {/* Problem */}
      <SectionHeading
        eyebrow="The Problem"
        title="Running an ecommerce business is harder than it should be"
        description="Too many tools. Too many subscriptions. Too much manual work. Every part of your business lives in a different place — and none of them talk to each other."
      />
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4">
        {fragmentedTools.map((t, i) => (
          <Reveal key={t.label} delay={i * 0.4}>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-4 text-center">
              <t.icon className="h-6 w-6 text-ink-400" />
              <span className="text-xs font-medium text-ink-500">{t.label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Solution */}
      <div className="mt-24">
        <SectionHeading
          eyebrow="The Solution"
          title={<>Everything your business needs. <span className="text-gradient">One intelligent platform.</span></>}
          description="EcomStrait replaces the fragmented stack with a single system where AI, suppliers, commerce, and analytics work together."
        />
        <Reveal className="relative mx-auto mt-14 max-w-3xl">
          <div className="relative flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-ink-100 bg-gradient-to-b from-white to-ink-50 p-8 sm:p-12">
            <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-ink-950 px-6 py-4 text-center shadow-2xl">
              <span className="text-sm font-bold text-white">EcomStrait</span>
              <span className="text-[10px] text-brand-400">Commerce OS</span>
            </div>
            {unified.map((label, i) => (
              <span
                key={label}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  i % 2 === 0
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-ai-200 bg-ai-50 text-ai-700"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button href="/why-ecomstrait" variant="outline" size="md">
              See why we&apos;re different <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
