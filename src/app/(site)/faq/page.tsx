import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AskEcomAI } from "@/components/ecomai/ask-ecomai";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Ask EcomAI",
  description:
    "Chat live with EcomAI, your AI ecommerce co-founder. Ask how it builds your store, finds suppliers, writes SEO, handles pricing and domains, and helps you launch and grow.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ask EcomAI"
        title="Talk to your AI co-founder"
        description="No static FAQ — ask EcomAI anything in your own words and get an instant, conversational answer."
      />
      <AskEcomAI />
      <CtaBanner />
    </>
  );
}
