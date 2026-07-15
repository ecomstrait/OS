import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { BenefitsGrid } from "@/components/shared/benefits-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { StoreGallery } from "@/components/shared/store-gallery";
import { RoiCalculator } from "@/components/home/roi-calculator";
import { LeadForm } from "@/components/shared/lead-form";
import { CtaBanner } from "@/components/shared/cta-banner";
import { storeOwnerBenefits } from "@/content/process";

export const metadata: Metadata = {
  title: "For Store Owners",
  description:
    "Launch a professional ecommerce store with AI — no inventory, no code. Ready-to-sell products, live preview, and an AI business advisor included.",
};

const plans = [
  { name: "Starter", price: "Coming soon", tagline: "Launch your first store", features: ["AI-built website", "Up to 100 products", "Custom domain", "Standard support"] },
  { name: "Growth", price: "Coming soon", tagline: "Scale with automation", features: ["Everything in Starter", "Unlimited products", "AI marketing & SEO", "Priority support"], featured: true },
  { name: "Agency", price: "Coming soon", tagline: "Launch stores for clients", features: ["Everything in Growth", "White-label", "Multi-store management", "Dedicated manager"] },
];

export default function StoreOwnersPage() {
  return (
    <>
      <PageHeader
        eyebrow="For Store Owners"
        title="Launch your online store with AI"
        description="Pick your products, describe your brand, and watch EcomAI build a professional store you can preview live and deploy in hours — no inventory to hold."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="#consultation" variant="primary" size="lg">Launch My Store</Button>
          <Button href="/store-gallery" variant="outline-light" size="lg">Browse the Gallery</Button>
        </div>
      </PageHeader>

      <Section tone="light">
        <SectionHeading
          eyebrow="Why Store Owners Choose Us"
          title="Start selling without the setup"
          description="We handle the technology, suppliers, and content so you can focus on your brand and your customers."
        />
        <div className="mt-14">
          <BenefitsGrid items={storeOwnerBenefits} />
        </div>
      </Section>

      <HowItWorks tone="muted" />

      <Section tone="light">
        <SectionHeading
          eyebrow="Inspiration"
          title="Stores we can build for you"
          description="A glimpse of what's possible across categories — each generated and customized with AI."
        />
        <div className="mt-14">
          <StoreGallery limit={8} />
        </div>
      </Section>

      {/* Pricing roadmap */}
      <Section tone="muted" id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, coming soon"
          description="A one-time build plus a monthly platform subscription. Detailed pricing is on the way — book a demo for a tailored quote."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border p-8 ${
                  plan.featured
                    ? "border-brand-300 bg-white shadow-2xl shadow-brand-500/10 ring-1 ring-brand-200"
                    : "border-ink-100 bg-white"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-ink-950">{plan.name}</h3>
                <p className="text-sm text-ink-500">{plan.tagline}</p>
                <p className="mt-5 text-2xl font-extrabold text-ink-950 font-display">{plan.price}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-ink-600">
                      <Check className="h-4 w-4 shrink-0 text-brand-500" strokeWidth={3} /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button href="#consultation" variant={plan.featured ? "primary" : "outline"} size="md" className="w-full">
                    Get notified
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <RoiCalculator />

      {/* Consultation */}
      <Section tone="muted" id="consultation">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Get Started"
            title="Request your store consultation"
            description="Tell us what you want to sell and we'll show you exactly how EcomStrait can launch and grow your business."
          />
          <LeadForm
            submitLabel="Request Consultation"
            successTitle="You're on the list!"
            successMessage="A store specialist will reach out to plan your launch and give you a tailored quote."
            fields={[
              { name: "name", label: "Your name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "niche", label: "What do you want to sell?", required: true, full: true, placeholder: "e.g. cosmetics, sports gear, home decor" },
              { name: "platform", label: "Preferred platform", type: "select", options: ["No preference", "Shopify", "Custom ecommerce"] },
              { name: "budget", label: "Budget range", type: "select", options: ["Under $1k", "$1k–$5k", "$5k–$20k", "$20k+"] },
              { name: "notes", label: "Anything else?", type: "textarea", full: true },
            ]}
          />
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
