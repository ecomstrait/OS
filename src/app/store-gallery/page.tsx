import type { Metadata } from "next";
import { StoreGalleryHero } from "@/components/pages/store-gallery-hero";
import { Section } from "@/components/ui/section";
import { StoreGallery } from "@/components/shared/store-gallery";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Store Gallery",
  description:
    "Browse AI-generated ecommerce store templates across fashion, cosmetics, electronics, furniture, and more — each responsive and ready to launch.",
};

export default function StoreGalleryPage() {
  return (
    <>
      <StoreGalleryHero />

      <Section tone="light">
        <StoreGallery filterable />
      </Section>

      <CtaBanner
        title="Love one of these? Make it yours."
        description="Pick a style, tell EcomAI about your brand, and we'll generate a store just like it — customized, on-brand, and ready to sell."
      />
    </>
  );
}
