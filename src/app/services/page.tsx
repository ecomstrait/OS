import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { ServicesHero } from "@/components/pages/services-hero";
import { ServicesExplorer } from "@/components/pages/services-explorer";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI website development, supplier management, store setup, SEO, hosting, automation, and an AI business consultant — the full ecommerce stack from one platform.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />

      <Section tone="light">
        <ServicesExplorer />
      </Section>

      <HowItWorks tone="muted" />
      <CtaBanner />
    </>
  );
}
