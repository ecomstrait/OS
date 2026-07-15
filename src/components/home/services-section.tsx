import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ServicesGrid } from "@/components/shared/services-grid";

export function ServicesSection() {
  return (
    <Section tone="light" id="services">
      <SectionHeading
        eyebrow="Services"
        title="Everything you need, done for you"
        description="From AI website development to hosting, SEO, and business automation — one team and one platform for your entire commerce operation."
      />
      <div className="mt-14">
        <ServicesGrid limit={6} />
      </div>
      <div className="mt-10 flex justify-center">
        <Button href="/services" variant="outline" size="md">
          Explore all services <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Section>
  );
}
