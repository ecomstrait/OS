import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ServicesGrid } from "@/components/shared/services-grid";

export function ServicesSection() {
  return (
    <Section tone="dark" id="services">
      <SectionHeading
        invert
        eyebrow="AI Business Services"
        title="Your AI team of specialists"
        description="EcomAI works like a full team of experts — builder, marketer, SEO consultant, analyst, and advisor — so you never have to hire an agency or a freelancer again."
      />
      <div className="mt-14">
        <ServicesGrid limit={6} />
      </div>
      <div className="mt-10 flex justify-center">
        <Button href="/services" variant="outline-light" size="md">
          Explore all services <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Section>
  );
}
