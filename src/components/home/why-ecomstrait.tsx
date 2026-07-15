import { ArrowRight, Check, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const highlights = [
  "AI-first, not AI as an afterthought",
  "One platform replaces ten tools",
  "Verified, ready-to-sell suppliers",
  "Live desktop & mobile preview",
  "Built-in AI business consultant",
  "White-label ready for agencies",
];

const comparison = [
  { task: "Find suppliers", traditional: "Weeks", ecom: "Minutes" },
  { task: "Build website", traditional: "Weeks", ecom: "Hours" },
  { task: "Product descriptions", traditional: "Manual", ecom: "AI generated" },
  { task: "SEO", traditional: "Manual", ecom: "Automated" },
  { task: "Analytics & AI advisor", traditional: "Not included", ecom: "Included" },
];

export function WhyEcomStrait() {
  return (
    <Section tone="light" id="why">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Why EcomStrait"
            title={<>More than a marketplace. More than a website builder.</>}
            description="Most platforms solve one problem. EcomStrait unifies suppliers, AI, automation, and commerce into a single operating system."
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <Reveal as="li" key={h} delay={i * 0.4} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-[15px] font-medium text-ink-700">{h}</span>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8">
            <Button href="/why-ecomstrait" variant="primary" size="md">
              Read the full comparison <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comparison card */}
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-950/5">
            <div className="grid grid-cols-3 border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <span className="p-4">Task</span>
              <span className="p-4 text-center">Traditional</span>
              <span className="p-4 text-center text-brand-700">EcomStrait</span>
            </div>
            {comparison.map((row) => (
              <div key={row.task} className="grid grid-cols-3 items-center border-b border-ink-100 text-sm last:border-0">
                <span className="p-4 font-medium text-ink-800">{row.task}</span>
                <span className="flex items-center justify-center gap-1.5 p-4 text-ink-400">
                  <X className="h-3.5 w-3.5" /> {row.traditional}
                </span>
                <span className="flex items-center justify-center gap-1.5 bg-brand-50/50 p-4 font-semibold text-brand-700">
                  <Check className="h-3.5 w-3.5" /> {row.ecom}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
