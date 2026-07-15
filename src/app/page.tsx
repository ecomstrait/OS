import { Hero } from "@/components/home/hero";
import { TrustedBy } from "@/components/home/trusted-by";
import { DualAudience } from "@/components/home/dual-audience";
import { ProblemSolution } from "@/components/home/problem-solution";
import { HowItWorks } from "@/components/home/how-it-works";
import { EcomAi } from "@/components/home/ecom-ai";
import { StoreGallerySection } from "@/components/home/store-gallery-section";
import { ServicesSection } from "@/components/home/services-section";
import { WhyEcomStrait } from "@/components/home/why-ecomstrait";
import { Testimonials } from "@/components/home/testimonials";
import { Statistics } from "@/components/home/statistics";
import { RoiCalculator } from "@/components/home/roi-calculator";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/shared/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustedBy />
      <DualAudience />
      <ProblemSolution />
      <HowItWorks />
      <EcomAi />
      <StoreGallerySection />
      <ServicesSection />
      <WhyEcomStrait />
      <Testimonials />
      <Statistics />
      <RoiCalculator />
      <FaqSection />
      <CtaBanner />
    </>
  );
}
