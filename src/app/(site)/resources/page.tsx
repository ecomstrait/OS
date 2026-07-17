import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, GraduationCap, FileText, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, articles, and documentation to help you launch and grow your ecommerce business with EcomStrait and AI.",
};

const collections = [
  { icon: Newspaper, title: "Blog", body: "Ecommerce trends, AI commerce, and growth playbooks." },
  { icon: GraduationCap, title: "Business Guides", body: "Step-by-step guides for suppliers and store owners." },
  { icon: FileText, title: "Documentation", body: "How the platform works, from onboarding to deploy." },
  { icon: BookOpen, title: "Success Stories", body: "Real businesses growing on EcomStrait." },
];

const articles = [
  { tag: "Guide", title: "How to launch your first AI-built store in a weekend", read: "8 min read" },
  { tag: "AI", title: "10 ways EcomAI saves store owners hours every week", read: "6 min read" },
  { tag: "Suppliers", title: "The verified supplier playbook: reach more retailers", read: "7 min read" },
  { tag: "SEO", title: "Automated SEO: ranking a new store from day one", read: "5 min read" },
  { tag: "Pricing", title: "Setting margins that actually grow your business", read: "6 min read" },
  { tag: "Growth", title: "From first sale to scale: an operator's checklist", read: "9 min read" },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Learn, build, and grow"
        description="Everything you need to master AI-powered commerce — from quick tips to in-depth guides and documentation."
      />

      <Section tone="light">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.4}>
              <div className="group flex h-full flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-6 transition hover:border-brand-200 hover:shadow-lg hover:shadow-ink-950/5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-ink-950">{c.title}</h3>
                <p className="text-sm text-ink-500">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="dark">
        <SectionHeading invert eyebrow="Latest" title="Fresh from the blog" align="left" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <Reveal key={a.title} delay={(i % 3) * 0.5}>
              <article className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-ink-950/5">
                <div className="mb-4 h-32 rounded-xl bg-gradient-to-br from-brand-100 via-ai-100 to-ink-100" />
                <span className="w-fit rounded-full bg-ink-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-600">
                  {a.tag}
                </span>
                <h3 className="mt-3 flex-1 text-base font-bold leading-snug text-ink-950 group-hover:text-brand-700">
                  {a.title}
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
                  <span>{a.read}</span>
                  <ArrowUpRight className="h-4 w-4 text-brand-600" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
