import type { Metadata } from "next";
import { Boxes, TrendingUp, Package, Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { BenefitsGrid } from "@/components/shared/benefits-grid";
import { LeadForm } from "@/components/shared/lead-form";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/shared/cta-banner";
import { supplierBenefits } from "@/content/process";

export const metadata: Metadata = {
  title: "For Suppliers",
  description:
    "Publish your catalog once and reach thousands of store owners. Automated orders, central inventory, and AI product enrichment for wholesale suppliers.",
};

const onboarding = [
  { step: "Register", detail: "Tell us about your business and catalog." },
  { step: "Get verified", detail: "Our team reviews and verifies you — usually within a few days." },
  { step: "Publish products", detail: "Upload your catalog; AI enriches every listing." },
  { step: "Start receiving orders", detail: "Store owners sell your products; orders route to you automatically." },
];

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        eyebrow="For Suppliers"
        title="Grow your wholesale business on autopilot"
        description="Publish once. Get discovered by thousands of store owners. Receive automated orders and keep inventory in sync — no spreadsheets required."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="#register" variant="primary" size="lg">Become a Supplier</Button>
          <Button href="/contact" variant="outline-light" size="lg">Talk to Sales</Button>
        </div>
      </PageHeader>

      <Section tone="light">
        <SectionHeading
          eyebrow="Benefits"
          title="Everything a modern supplier needs"
          description="Reach, automation, and intelligence — built to help you sell more with less effort."
        />
        <div className="mt-14">
          <BenefitsGrid items={supplierBenefits} />
        </div>
      </Section>

      {/* Dashboard preview */}
      <Section tone="muted">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Supplier Dashboard"
            title="Your whole wholesale business, one screen"
            description="Track revenue, orders, top products, and live inventory. Let AI surface what to restock and what's trending."
          />
          <Reveal>
            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-xl shadow-ink-950/5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: "Revenue", value: "$128,400", tone: "text-brand-600" },
                  { icon: Boxes, label: "Orders", value: "3,942", tone: "text-ai-600" },
                  { icon: Package, label: "Products in sync", value: "1,240", tone: "text-ink-900" },
                  { icon: Bell, label: "Low-stock alerts", value: "6", tone: "text-amber-600" },
                ].map((w) => (
                  <div key={w.label} className="rounded-2xl bg-ink-50 p-4">
                    <w.icon className={`h-5 w-5 ${w.tone}`} />
                    <p className="mt-3 text-xl font-extrabold text-ink-950 font-display">{w.value}</p>
                    <p className="text-xs text-ink-500">{w.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
                <p className="text-xs font-semibold text-brand-700">AI Recommendation</p>
                <p className="mt-1 text-sm text-ink-700">
                  Demand for &ldquo;Organic Cotton Tee&rdquo; is up 40%. Consider restocking 500 units this week.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Onboarding */}
      <Section tone="light">
        <SectionHeading eyebrow="Onboarding" title="Get verified in four steps" />
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {onboarding.map((o, i) => (
            <Reveal key={o.step} delay={i}>
              <div className="rounded-2xl border border-ink-100 bg-white p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-950 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-ink-950">{o.step}</h3>
                <p className="mt-2 text-sm text-ink-500">{o.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Registration */}
      <Section tone="muted" id="register">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Register"
            title="Apply to become a verified supplier"
            description="Tell us about your business and we'll get you set up. The first 100 suppliers receive premium access."
          />
          <LeadForm
            submitLabel="Submit Application"
            successTitle="Application received!"
            successMessage="Our supplier team will review your details and reach out within a few business days."
            fields={[
              { name: "company", label: "Company name", required: true, full: true },
              { name: "contact", label: "Contact name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "phone", label: "Phone", type: "tel" },
              { name: "category", label: "Product category", type: "select", required: true, options: ["Fashion", "Cosmetics", "Electronics", "Furniture", "Grocery", "Medical", "Sports", "Other"] },
              { name: "catalog", label: "Approx. catalog size", type: "select", options: ["1–50", "50–500", "500–5,000", "5,000+"] },
              { name: "about", label: "Tell us about your business", type: "textarea", full: true, placeholder: "What do you make or distribute?" },
            ]}
          />
        </div>
      </Section>

      <FaqSection tone="light" />
      <CtaBanner />
    </>
  );
}
