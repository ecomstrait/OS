import { ArrowRight, Boxes, Store, Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const cards = [
  {
    icon: Boxes,
    tone: "brand" as const,
    eyebrow: "For Suppliers",
    title: "Grow your wholesale business",
    benefits: ["Publish products once", "Manage inventory centrally", "Receive automated orders", "Real-time analytics", "Reach thousands of retailers"],
    cta: { label: "Become a Supplier", href: "/suppliers" },
  },
  {
    icon: Store,
    tone: "ai" as const,
    eyebrow: "For Store Owners",
    title: "Launch your store with AI",
    benefits: ["AI-built website", "Live desktop & mobile preview", "Ready-to-sell products", "No inventory to hold", "Start selling in hours"],
    cta: { label: "Launch My Store", href: "/store-owners" },
  },
];

export function DualAudience() {
  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="One Platform. Two Opportunities."
        title="Whichever side you're on, we've built it for you"
        description="Suppliers and store owners meet on one intelligent platform — each with the tools, automation, and AI to grow faster together."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {cards.map((card, i) => {
          const isBrand = card.tone === "brand";
          return (
            <Reveal key={card.title} delay={i}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-ink-950/5 sm:p-10">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl ${
                    isBrand ? "bg-brand-500" : "bg-ai-500"
                  } text-white shadow-lg`}
                >
                  <card.icon className="h-7 w-7" />
                </span>
                <p className={`mt-6 text-xs font-bold uppercase tracking-[0.14em] ${isBrand ? "text-brand-600" : "text-ai-600"}`}>
                  {card.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-ink-950">{card.title}</h3>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {card.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] text-ink-600">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${isBrand ? "bg-brand-50 text-brand-600" : "bg-ai-50 text-ai-600"}`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button href={card.cta.href} variant={isBrand ? "primary" : "ai"} size="md">
                    {card.cta.label} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
