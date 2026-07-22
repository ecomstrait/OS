import type { Metadata } from "next";
import { Rocket, Settings2, TrendingUp, Store, Boxes, Users, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/shared/cta-banner";
import { supplierSignupUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "EcomStrait is building EcomAI — the world's first AI ecommerce co-founder. Describe a business idea and watch it get built: suppliers, store, SEO, and marketing included.",
};

const pillars = [
  { icon: Rocket, title: "Launch", body: "Go from a single sentence to a live, on-brand store — suppliers, products, SEO, and payments included — in minutes, not weeks." },
  { icon: Settings2, title: "Operate", body: "One platform replaces ten tools. EcomAI handles the busywork so running a store feels effortless." },
  { icon: TrendingUp, title: "Grow", body: "Your AI co-founder finds profitable products, writes your marketing, and spots what to fix next — around the clock." },
];

const audiences = [
  { icon: Rocket, title: "Entrepreneurs", body: "Have an idea, no idea where to start? Describe it and watch your first business get built." },
  { icon: Store, title: "Store owners", body: "Already selling? Let EcomAI optimise conversion, products, and marketing for you." },
  { icon: Boxes, title: "Suppliers", body: "Publish your catalogue once and reach thousands of AI-generated stores." },
  { icon: Users, title: "Agencies", body: "Build and launch client stores in a fraction of the time, white-label ready." },
];

const values = [
  { title: "Transformation over tools", body: "We don't sell software — we sell the business you're about to build. Every feature answers one question: what will your future business look like?" },
  { title: "Honesty", body: "We're pre-launch, and we say so. Numbers you see are labelled example ranges, never fabricated stats presented as live data." },
  { title: "Real AI, not a buzzword", body: "EcomAI has to genuinely save you time and money — or it doesn't ship. Intelligence you can watch working." },
  { title: "Trust", body: "Suppliers and founders trust us with their businesses. Verified suppliers, private data, and clear pricing — no hidden surprises." },
  { title: "Simplicity", body: "Complex operations should feel simple. We hide the complexity, never the control." },
  { title: "Growth for everyone", body: "Every decision should help someone earn more, save time, or scale faster — supplier, founder, or agency." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About EcomStrait"
        title="The world's first AI ecommerce co-founder"
        description="Most people don't want to buy software — they want a profitable business. EcomStrait is building EcomAI so anyone can go from “I have an idea” to a launched online business, without code, agencies, or inventory."
      />

      {/* Mission / Vision */}
      <Section tone="light">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-ink-100 bg-ink-50/60 p-8">
              <h2 className="text-xl font-bold text-ink-950">Our mission</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                To give every entrepreneur an AI co-founder. EcomAI automates the hard
                parts of commerce — finding suppliers, building the store, writing SEO
                and marketing — so launching a business is as simple as describing it.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <div className="h-full rounded-3xl border border-ink-100 bg-ink-50/60 p-8">
              <h2 className="text-xl font-bold text-ink-950">Our vision</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                A world where a great idea is all you need to start. EcomStrait becomes
                the intelligent commerce ecosystem where founders, suppliers, and
                agencies build and grow together — with AI doing the heavy lifting.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Why we exist */}
      <Section tone="muted">
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeading
            eyebrow="Why we exist"
            title="Building a business is broken"
            description="Website, hosting, SEO, an agency, marketing tools, supplier hunting — a stack of ten tools, $1,000+ a month, and weeks of setup before you sell a single thing."
          />
          <Reveal className="mt-8">
            <p className="mx-auto max-w-2xl text-lg font-medium text-ink-700">
              We think it should be one prompt. Tell EcomAI what you want to build, and
              watch your suppliers, store, brand, and marketing come together in front
              of you — then launch.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Pillars */}
      <Section tone="light">
        <SectionHeading
          eyebrow="What EcomAI does"
          title="Launch. Operate. Grow."
          description="Three things your AI co-founder does for you, from day one."
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

      {/* Who we build for */}
      <Section tone="muted">
        <SectionHeading
          eyebrow="Who we build for"
          title="One platform, four kinds of builders"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={(i % 4) * 0.4}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ai-50 text-ai-600">
                  <a.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-ink-950">{a.title}</h3>
                <p className="text-sm leading-relaxed text-ink-500">{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Values */}
      <Section tone="dark">
        <SectionHeading invert eyebrow="Our values" title="What we stand for" />
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

      {/* Pre-launch honesty band */}
      <Section tone="light">
        <Reveal className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-ai-100 bg-ai-50/50 p-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ai-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ai-700">
              <Sparkles className="h-3.5 w-3.5" /> Rolling out in beta
            </span>
            <h2 className="text-xl font-bold text-ink-950">We&apos;re just getting started</h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-ink-600">
              EcomAI is rolling out to founders first. Everything you see on this site is
              a simulated preview of the product we&apos;re building — join the waitlist
              to help shape it and get early access.
            </p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row">
              <Button href="/#builder" variant="primary" size="md">
                Watch AI build a business
              </Button>
              <Button href={supplierSignupUrl} variant="outline" size="md">
                Become a supplier
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>

      <CtaBanner />
    </>
  );
}
