import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { howItWorks } from "@/content/process";

export function HowItWorks({ tone = "muted" }: { tone?: "light" | "muted" }) {
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow="How It Works"
        title="From supplier shelf to selling online in five steps"
        description="A single, guided journey — no developers, no agencies, no guesswork."
      />
      <div className="mt-16 grid gap-6 md:grid-cols-5">
        {howItWorks.map((step, i) => (
          <Reveal key={step.title} delay={i} className="relative">
            {/* Connector */}
            {i < howItWorks.length - 1 && (
              <span className="absolute left-[calc(50%+28px)] top-7 hidden h-px w-[calc(100%-40px)] bg-gradient-to-r from-brand-300 to-ink-200 md:block" />
            )}
            <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-lg shadow-ink-950/5 ring-1 ring-ink-100">
                <Icon name={step.icon} className="h-6 w-6 text-brand-600" />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {step.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
