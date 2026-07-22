import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { HelpForm } from "@/components/help/help-form";

export const metadata: Metadata = { title: "Help & support" };

const faqs = [
  {
    q: "How do I get verified?",
    a: "Complete the 5-step onboarding and upload your documents. Our team reviews them and approves your account — you'll see the status on your dashboard.",
  },
  {
    q: "When can I add products?",
    a: "Publishing unlocks once your account is approved. Until then, catalog, inventory, and requests are locked.",
  },
  {
    q: "How do product requests work?",
    a: "Store owners send you requests to fulfil. Open Requests to accept, decline, or propose an alternative, and reply in the thread. The store owner is notified by email.",
  },
  {
    q: "What is my Quality Score?",
    a: "A 0–100 score from your profile completeness, verification, catalog depth, inventory health, and how quickly you respond to and accept requests. See Analytics for the breakdown.",
  },
  {
    q: "How do I add teammates?",
    a: "Go to Settings → Team and invite them by email. They're added automatically when they sign in with the invited address.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Help &amp; support</h1>
          <p className="text-sm text-ink-500">Answers to common questions, or send us a message.</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-950">Frequently asked</h2>
        <div className="mt-3 divide-y divide-ink-50 rounded-2xl border border-ink-100 bg-white">
          {faqs.map((f) => (
            <div key={f.q} className="p-5">
              <p className="text-sm font-semibold text-ink-900">{f.q}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-950">Contact support</h2>
        <p className="mb-4 mt-1 text-sm text-ink-500">
          Can&apos;t find an answer? Send us a message and we&apos;ll reply by email.
        </p>
        <HelpForm />
      </section>
    </div>
  );
}
