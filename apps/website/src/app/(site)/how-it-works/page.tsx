import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HowItWorks } from "@/components/home/how-it-works";
import { EcomAi } from "@/components/home/ecom-ai";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how EcomStrait takes you from supplier products to a live, AI-built ecommerce store in five simple steps.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How It Works"
        title="Idea to live store, in a single sitting"
        description="No developers. No agencies. Just a guided, AI-powered path from products to profits."
      />
      <HowItWorks tone="light" />
      <EcomAi />
      <CtaBanner />
    </>
  );
}
