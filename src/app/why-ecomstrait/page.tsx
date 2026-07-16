import type { Metadata } from "next";
import { WhyHero } from "@/components/pages/why-hero";
import { WhyLandscape } from "@/components/pages/why-landscape";
import { WhyDifferentiators } from "@/components/pages/why-differentiators";
import { WhyComparison } from "@/components/pages/why-comparison";
import { WhyFit } from "@/components/pages/why-fit";
import { Testimonials } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Why EcomStrait",
  description:
    "More than a marketplace or website builder — see how EcomStrait unifies suppliers, AI, automation, and commerce into one platform, and how it compares.",
};

export default function WhyEcomStraitPage() {
  return (
    <>
      <WhyHero />

      {/* Traditional solutions */}
      <WhyLandscape />

      {/* Why we're different */}
      <WhyDifferentiators />

      {/* Time & cost comparison */}
      <WhyComparison />

      <Testimonials />

      {/* Why NOT */}
      <WhyFit />

      <FaqSection tone="muted" />
      <CtaBanner />
    </>
  );
}
