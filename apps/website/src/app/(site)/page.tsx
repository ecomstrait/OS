import { Hero } from "@/components/home/hero";
// AI Website Builder — hidden from the site for now, not removed. Re-enable
// by uncommenting this import and the <AiBuilder /> usage below.
// import { AiBuilder } from "@/components/home/ai-builder";
import { AiSimulator } from "@/components/home/ai-simulator";
import { HowItWorks } from "@/components/home/how-it-works";
import { ServicesSection } from "@/components/home/services-section";
import { WhyEcomStrait } from "@/components/home/why-ecomstrait";
import { FounderStories } from "@/components/home/founder-stories";
import { TrustedBy } from "@/components/home/trusted-by";
import { CtaBanner } from "@/components/shared/cta-banner";

// The homepage now leads with the flagship AI moments (Hero → AI Builder → AI
// Simulator). Other sections live on dedicated pages: the Problem (/problem),
// "Meet EcomAI" (/how-it-works), the ROI calculator (merged into the Simulator),
// and the FAQ (/faq, as "Ask EcomAI").

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <AiBuilder /> */}
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
