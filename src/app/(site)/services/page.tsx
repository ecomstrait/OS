import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { ServicesHero } from "@/components/pages/services-hero";
import { ServicesExplorer } from "@/components/pages/services-explorer";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "AI Business Services",
  description:
    "EcomAI works like a full team of specialists — AI website builder, marketer, SEO consultant, inventory manager, analyst, and business advisor — running your store from a single prompt.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />

      <Section tone="light">
        <ServicesExplorer />
      </Section>

      <HowItWorks tone="dark" />
      <CtaBanner />
    </>
  );
}
