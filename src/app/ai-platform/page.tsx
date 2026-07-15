import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EcomAi } from "@/components/home/ecom-ai";
import { CtaBanner } from "@/components/shared/cta-banner";
import { aiFeatures } from "@/content/ai";

export const metadata: Metadata = {
  title: "AI Platform",
  description:
    "EcomAI powers website generation, product content, SEO, marketing, analytics, and forecasting — the intelligence layer of your commerce business.",
};

export default function AiPlatformPage() {
  return (
    <>
      <PageHeader
        eyebrow="EcomAI Platform"
        title="AI that works for your business"
        description="From building your website to forecasting sales, EcomAI is the intelligence layer running quietly behind every part of your store."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/store-owners" variant="primary" size="lg">Try It Free</Button>
          <Button href="#demo" variant="outline-light" size="lg">See the Demo</Button>
        </div>
      </PageHeader>

      <Section tone="light">
        <SectionHeading
          eyebrow="Capabilities"
          title="One AI, many jobs"
          description="Every capability is designed to remove manual work and help you make better decisions, faster."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.5}>
              <div className="group relative flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:border-ai-200 hover:shadow-xl hover:shadow-ink-950/5">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-ai-50 text-ai-600 transition group-hover:bg-ai-500 group-hover:text-white">
                    <Icon name={f.icon} className="h-6 w-6" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      f.status === "live"
                        ? "bg-brand-50 text-brand-600"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {f.status === "live" ? "Live" : "Soon"}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <div id="demo">
        <EcomAi />
      </div>

      <CtaBanner
        title="Put EcomAI to work"
        description="Launch a store and let AI handle the building, writing, optimizing, and advising — so you can focus on growing."
      />
    </>
  );
}
