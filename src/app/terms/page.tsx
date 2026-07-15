import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="July 2026"
      intro="The terms that govern your use of the EcomStrait platform."
      sections={[
        { heading: "Acceptance of terms", body: ["By accessing or using EcomStrait, you agree to be bound by these terms. If you do not agree, please do not use the platform."] },
        { heading: "Use of the platform", body: ["You agree to use EcomStrait lawfully and not to misuse the services, interfere with their operation, or infringe on others' rights.", "Suppliers are responsible for the accuracy of their catalogs; store owners are responsible for their storefront content and customer relationships."] },
        { heading: "Payments & subscriptions", body: ["Certain features require paid subscriptions or one-time fees. Pricing and billing terms will be presented before purchase."] },
        { heading: "Intellectual property", body: ["You retain ownership of your brand and content. EcomStrait retains ownership of the platform, software, and underlying technology."] },
        { heading: "Limitation of liability", body: ["The platform is provided “as is.” To the extent permitted by law, EcomStrait is not liable for indirect or consequential damages."] },
        { heading: "Contact", body: ["Questions about these terms? Email legal@ecomstrait.com."] },
      ]}
    />
  );
}
