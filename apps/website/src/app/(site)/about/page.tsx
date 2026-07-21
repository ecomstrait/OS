import type { Metadata } from "next";
import { Rocket, Settings2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Statistics } from "@/components/home/statistics";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "About",
  description:
    "EcomStrait is building the AI-powered Commerce Operating System — removing the barriers to entrepreneurship for suppliers and store owners alike.",
};

const values = [
  { title: "Simplicity", body: "Complex business operations should feel simple. We hide the complexity, not the control." },
  { title: "Trust", body: "Suppliers and store owners trust us with their businesses. Every interaction reinforces confidence." },
  { title: "Innovation", body: "AI should genuinely save time — not exist as a marketing term." },
  { title: "Growth", body: "Every feature should help users earn more, save time, or scale faster." },
  { title: "Transparency", body: "Clear pricing, clear communication, no hidden surprises." },
];

const pillars = [
  { icon: Rocket, title: "Launch", body: "Go from idea to a live online business with as little friction as possible." },
  { icon: Settings2, title: "Operate", body: "The tools, automation, analytics, and workflows to run a modern store efficiently." },
  { icon: TrendingUp, title: "Grow", body: "AI, data, and intelligent recommendations to improve profitability and scale." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About EcomStrait"
        title="We're removing the barriers to entrepreneurship"
        description="Anyone with a business idea should be able to launch a professional online business — without technical expertise, supplier negotiations, or complex setup."
      />

      <Section tone="light">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-8">
              <h2 className="text-xl font-bold text-ink-950">Our Mission</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                To empower suppliers and entrepreneurs through intelligent technology
                that automates ecommerce operations, reduces startup costs, and
                accelerates business growth. Launching should be as simple as choosing
                products, customizing a brand, and clicking Deploy.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-8">
              <h2 className="text-xl font-bold text-ink-950">Our Vision</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                To become the world&apos;s most intelligent AI-powered commerce
                ecosystem — enabling anyone to build, launch, and grow an online
                business without technical expertise or inventory management challenges.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Statistics />

      <Section tone="muted">
        <SectionHeading
          eyebrow="Our Pillars"
          title="Launch. Operate. Grow."
          description="Every decision we make supports at least one of these three pillars."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i}>
              <div className="flex h-full flex-col gap-3 rounded-3xl border border-ink-100 bg-white p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-2 text-lg font-bold text-ink-950">{p.title}</h3>
                <p className="text-sm leading-relaxed text-ink-500">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="dark">
        <SectionHeading
          invert
          eyebrow="Our Values"
          title="What we stand for"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={(i % 3) * 0.5}>
              <div className="h-full rounded-2xl border border-ink-100 bg-white p-6">
                <h3 className="text-base font-bold text-ink-950">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
