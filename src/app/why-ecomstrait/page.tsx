import type { Metadata } from "next";
import { Check, X, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Testimonials } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Why EcomStrait",
  description:
    "More than a marketplace or website builder — see how EcomStrait unifies suppliers, AI, automation, and commerce into one platform, and how it compares.",
};

const alternatives = [
  { name: "Shopify", pros: ["Great for building stores"], cons: ["No supplier marketplace", "No AI consultant", "No supplier onboarding"] },
  { name: "Agencies", pros: ["Custom websites"], cons: ["Expensive", "Slow delivery", "Limited ongoing support"] },
  { name: "Alibaba", pros: ["Large supplier network"], cons: ["No website creation", "No automation", "No AI"] },
  { name: "Dropshipping apps", pros: ["Easy product sourcing"], cons: ["Weak branding", "Little intelligence", "Limited customization"] },
];

const differentiators: { icon: IconName; title: string }[] = [
  { icon: "Wand2", title: "AI Website Builder" },
  { icon: "Bot", title: "AI Business Consultant" },
  { icon: "Boxes", title: "Supplier Marketplace" },
  { icon: "Rocket", title: "Store Launch Service" },
  { icon: "Eye", title: "Live Website Preview" },
  { icon: "Package", title: "Inventory Management" },
  { icon: "BarChart3", title: "Analytics Dashboard" },
  { icon: "Search", title: "SEO Automation" },
  { icon: "MessageSquare", title: "Marketing Assistant" },
  { icon: "FileText", title: "Product Management" },
  { icon: "Lightbulb", title: "Business Insights" },
  { icon: "Layers", title: "White-label Ready" },
];

const comparison = [
  { task: "Find suppliers", traditional: "Weeks", ecom: "Minutes" },
  { task: "Build website", traditional: "Weeks", ecom: "Hours" },
  { task: "Product setup", traditional: "Days", ecom: "Automated" },
  { task: "SEO", traditional: "Manual", ecom: "AI generated" },
  { task: "Product descriptions", traditional: "Manual", ecom: "AI generated" },
  { task: "Inventory", traditional: "Separate tool", ecom: "Built in" },
  { task: "Analytics", traditional: "Multiple tools", ecom: "Built in" },
  { task: "AI consultant", traditional: "Not available", ecom: "Included" },
];

const notForYou = [
  "You only need a basic brochure website.",
  "You already run a mature, deeply-customized enterprise commerce stack.",
  "You'd rather do every task manually without AI assistance.",
  "You're not planning to sell products online.",
];

export default function WhyEcomStraitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Why EcomStrait"
        title="More than a marketplace. More than a website builder."
        description="EcomStrait combines suppliers, AI, automation, and commerce technology into one intelligent platform that helps you launch, manage, and grow."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/store-owners" variant="primary" size="lg">Launch My Store</Button>
          <Button href="/suppliers" variant="outline-light" size="lg">Become a Supplier</Button>
        </div>
      </PageHeader>

      {/* Traditional solutions */}
      <Section tone="light">
        <SectionHeading
          eyebrow="The Landscape"
          title="Most platforms solve only one problem"
          description="Each tool does part of the job. You're left stitching them together — and paying for all of them."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {alternatives.map((alt, i) => (
            <Reveal key={alt.name} delay={i * 0.4}>
              <div className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6">
                <h3 className="text-lg font-bold text-ink-950">{alt.name}</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {alt.pros.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-ink-700">
                      <Check className="h-4 w-4 shrink-0 text-brand-500" /> {p}
                    </li>
                  ))}
                  {alt.cons.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-ink-400">
                      <X className="h-4 w-4 shrink-0 text-red-400" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Why we're different */}
      <Section tone="muted">
        <SectionHeading
          eyebrow="Why We're Different"
          title="One platform. Everything you need."
          description="Stop managing ten different tools. Run your entire business from one intelligent system."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((d, i) => (
            <Reveal key={d.title} delay={(i % 3) * 0.5}>
              <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name={d.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink-900">{d.title}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Time & cost comparison */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Save Time. Save Money."
          title="Traditional vs. EcomStrait"
          description="The same work, a fraction of the time and cost."
        />
        <Reveal className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-ink-100 shadow-xl shadow-ink-950/5">
          <div className="grid grid-cols-3 bg-ink-950 text-xs font-semibold uppercase tracking-wide text-white">
            <span className="p-4">Task</span>
            <span className="p-4 text-center text-ink-300">Traditional</span>
            <span className="p-4 text-center text-brand-400">EcomStrait</span>
          </div>
          {comparison.map((row, i) => (
            <div key={row.task} className={`grid grid-cols-3 items-center text-sm ${i % 2 ? "bg-ink-50/60" : "bg-white"}`}>
              <span className="p-4 font-medium text-ink-800">{row.task}</span>
              <span className="p-4 text-center text-ink-400">{row.traditional}</span>
              <span className="p-4 text-center font-semibold text-brand-700">{row.ecom}</span>
            </div>
          ))}
        </Reveal>
      </Section>

      <Testimonials />

      {/* Why NOT */}
      <Section tone="light">
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Honest Fit"
            title="EcomStrait isn't for everyone — and that's okay"
            description="We're built for businesses that want to move faster, automate smarter, and scale confidently. If that's not you, another tool may fit better."
          />
          <Reveal>
            <ul className="space-y-3">
              {notForYou.map((n) => (
                <li key={n} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-sm text-ink-600">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" /> {n}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button href="/store-owners" variant="primary" size="md">
                Sounds like us — let&apos;s go <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <FaqSection tone="muted" />
      <CtaBanner />
    </>
  );
}
