import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Accordion, type FaqItem } from "@/components/ui/accordion";
import { homeFaqs } from "@/content/faqs";

export function FaqSection({
  items = homeFaqs,
  tone = "muted",
}: {
  items?: FaqItem[];
  tone?: "light" | "muted";
}) {
  return (
    <Section tone={tone} id="faqs">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know about launching and growing on EcomStrait. Can't find an answer? Reach out any time."
        />
        <Reveal>
          <Accordion items={items} />
        </Reveal>
      </div>
    </Section>
  );
}
