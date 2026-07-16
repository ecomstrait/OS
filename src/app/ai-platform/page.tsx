import type { Metadata } from "next";
import { EcomAi } from "@/components/home/ecom-ai";
import { CtaBanner } from "@/components/shared/cta-banner";
import { AiPlatformHero } from "@/components/pages/ai-platform-hero";
import { AiCapabilities } from "@/components/pages/ai-capabilities";

export const metadata: Metadata = {
  title: "AI Platform",
  description:
    "EcomAI powers website generation, product content, SEO, marketing, analytics, and forecasting — the intelligence layer of your commerce business.",
};

export default function AiPlatformPage() {
  return (
    <>
      <AiPlatformHero />

      <AiCapabilities />

      <div id="demo">
        <EcomAi />
      </div>

      <CtaBanner
        title="Put EcomAI to work"
        description="Launch a store and let AI handle the building, writing, optimizing, and advising — so you can focus on growing."
      />
    </>
  );
}
