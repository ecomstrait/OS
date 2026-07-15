import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/ui/section";
import { ServicesGrid } from "@/components/shared/services-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaBanner } from "@/components/shared/cta-banner";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI website development, supplier management, store setup, SEO, hosting, automation, and an AI business consultant — the full ecommerce stack from one platform.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything you need to launch and grow"
        description="From your first prompt to a scaled, automated business — EcomStrait delivers the services and AI to run your entire commerce operation."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/store-owners" variant="primary" size="lg">Launch My Store</Button>
          <Button href="/contact" variant="outline-light" size="lg">Book a Demo</Button>
        </div>
      </PageHeader>

      <Section tone="light">
        <ServicesGrid detailed />
      </Section>

      <HowItWorks tone="muted" />
      <CtaBanner />
    </>
  );
}
