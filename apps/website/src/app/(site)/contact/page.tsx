import type { Metadata } from "next";
import { Mail, MessageCircle, Briefcase, LifeBuoy, Sparkles, Boxes } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/shared/lead-form";
import { siteConfig, supplierSignupUrl, merchantSignupUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the EcomStrait team about building a business with EcomAI, becoming a supplier, partnerships, or support. We reply within one business day.",
};

const channels = [
  { icon: Briefcase, title: "Sales & founders", body: "Building a business or exploring the platform.", value: siteConfig.email },
  { icon: LifeBuoy, title: "Support", body: "Questions about your account or store.", value: "support@ecomstrait.com" },
  { icon: MessageCircle, title: "WhatsApp", body: "Chat with us for quick answers.", value: siteConfig.whatsapp },
  { icon: Mail, title: "Partnerships", body: "Agencies, integrations, and resellers.", value: "partners@ecomstrait.com" },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to a human"
        description="EcomAI never sleeps — but sometimes you want a person. Whether you're building your first business, joining as a supplier, or exploring a partnership, we'd love to hear from you. We reply within one business day."
      />

      <Section tone="light">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* Channels */}
          <div className="flex flex-col gap-4">
            {channels.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.4}>
                <div className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink-950">{c.title}</h2>
                    <p className="text-sm text-ink-500">{c.body}</p>
                    <p className="mt-1 text-sm font-medium text-brand-700">{c.value}</p>
                  </div>
                </div>
              </Reveal>
            ))}

            {/* Prefer to self-serve */}
            <Reveal delay={1.6}>
              <div className="rounded-2xl border border-ai-100 bg-ai-50/50 p-5">
                <p className="text-sm font-semibold text-ink-950">Prefer to skip the wait?</p>
                <p className="mt-1 text-sm text-ink-500">
                  Watch EcomAI build a business, or start selling as a supplier — no call needed.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button href={merchantSignupUrl} variant="primary" size="sm">
                    <Sparkles className="h-4 w-4" /> Build a business
                  </Button>
                  <Button href={supplierSignupUrl} variant="outline" size="sm">
                    <Boxes className="h-4 w-4" /> Become a supplier
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Form */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="Send a message"
              title="Tell us what you're building"
              className="mb-8"
            />
            <LeadForm
              formName="contact"
              submitLabel="Send Message"
              successTitle="Message sent!"
              successMessage="Thanks for reaching out. We'll get back to you within one business day."
              fields={[
                { name: "name", label: "Your name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "topic", label: "I'm reaching out about", type: "select", required: true, full: true, options: ["Building a business", "Becoming a supplier", "Partnership", "Support", "Something else"] },
                { name: "message", label: "Message", type: "textarea", required: true, full: true },
              ]}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
