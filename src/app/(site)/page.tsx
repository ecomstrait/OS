import { Hero } from "@/components/home/hero";
import { AiBuilder } from "@/components/home/ai-builder";
import { AiSimulator } from "@/components/home/ai-simulator";
// DualAudience replaced by the AI Business Simulator (persona + estimate).
// import { DualAudience } from "@/components/home/dual-audience";
// Problem / Solution now lives on its own page (/problem), linked from the nav.
// import { ProblemSolution } from "@/components/home/problem-solution";
import { HowItWorks } from "@/components/home/how-it-works";
// "Meet EcomAI" retired from the homepage — the AI story now lives in the
// Hero, AI Builder, and AI Simulator flagship moments.
// import { EcomAi } from "@/components/home/ecom-ai";
// Store Gallery hidden for now — it would reveal how EcomAI generates stores.
// import { StoreGallerySection } from "@/components/home/store-gallery-section";
import { ServicesSection } from "@/components/home/services-section";
import { WhyEcomStrait } from "@/components/home/why-ecomstrait";
import { FounderStories } from "@/components/home/founder-stories";
import { TrustedBy } from "@/components/home/trusted-by";
// "By the numbers" retired from the homepage.
// import { Statistics } from "@/components/home/statistics";
// ROI calculator merged into the AI Business Simulator.
// import { RoiCalculator } from "@/components/home/roi-calculator";
// FAQ moved to its own page (/faq) as an "Ask EcomAI" experience.
// import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/shared/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AiBuilder />
      <AiSimulator />
      <HowItWorks />
      <ServicesSection />
      <WhyEcomStrait />
      <FounderStories />
      <TrustedBy />
      <CtaBanner />
    </>
  );
}
