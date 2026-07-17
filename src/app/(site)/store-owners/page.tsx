import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { StoreOwnersHero } from "@/components/pages/store-owners-hero";
import { PricingPlans } from "@/components/pages/pricing-plans";
import { BenefitsGrid } from "@/components/shared/benefits-grid";
import { HowItWorks } from "@/components/home/how-it-works";
// import { StoreGallery } from "@/components/shared/store-gallery"; // gallery hidden for now
import { RoiCalculator } from "@/components/home/roi-calculator";
import { LeadForm } from "@/components/shared/lead-form";
import { CtaBanner } from "@/components/shared/cta-banner";
import { storeOwnerBenefits } from "@/content/process";

export const metadata: Metadata = {
  title: "For Store Owners",
  description:
    "Launch a professional ecommerce store with AI — no inventory, no code. Ready-to-sell products, live preview, and an AI business advisor included.",
};

export default function StoreOwnersPage() {
  return (
    <>
      <StoreOwnersHero />

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

      <HowItWorks tone="dark" />

      {/* Store gallery hidden for now — would reveal how EcomAI generates stores.
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
      */}

      <PricingPlans />

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
            formName="store-consultation"
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
