import type { Metadata } from "next";
import { Monitor, Smartphone, Tablet, Moon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/ui/section";
import { StoreGallery } from "@/components/shared/store-gallery";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "Store Gallery",
  description:
    "Browse AI-generated ecommerce store templates across fashion, cosmetics, electronics, furniture, and more — each responsive and ready to launch.",
};

const features = [
  { icon: Monitor, label: "Desktop" },
  { icon: Tablet, label: "Tablet" },
  { icon: Smartphone, label: "Mobile" },
  { icon: Moon, label: "Dark mode" },
];

export default function StoreGalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Store Gallery"
        title="Get inspired. Then build yours."
        description="Every store below was designed to convert and generated with AI. Filter by category, preview the experience, and launch a similar store in hours."
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          {features.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-200"
            >
              <f.icon className="h-3.5 w-3.5 text-brand-400" /> {f.label}
            </span>
          ))}
        </div>
      </PageHeader>

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
