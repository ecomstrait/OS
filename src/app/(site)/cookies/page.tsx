import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How and why EcomStrait uses cookies and similar technologies, and how to manage your preferences.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="July 2026"
      intro="How and why EcomStrait uses cookies and similar technologies."
      sections={[
        { heading: "What are cookies", body: ["Cookies are small text files stored on your device that help websites remember your preferences and understand how you use them."] },
        { heading: "How we use cookies", body: ["We use essential cookies to run the site, analytics cookies to understand usage, and preference cookies to remember your settings."] },
        { heading: "Managing cookies", body: ["You can control or delete cookies through your browser settings. Disabling some cookies may affect how the site works."] },
        { heading: "Contact", body: ["Questions about our use of cookies? Email privacy@ecomstrait.com."] },
      ]}
    />
  );
}
