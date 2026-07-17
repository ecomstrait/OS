import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      intro="How EcomStrait collects, uses, and protects your information."
      sections={[
        { heading: "Information we collect", body: ["We collect information you provide when you register, request a store, or contact us — such as your name, email, company, and business details.", "We also collect usage data to improve the platform and your experience."] },
        { heading: "How we use your information", body: ["To provide and improve our services, communicate with you, process requests, and personalize recommendations powered by AI.", "We do not sell your personal information."] },
        { heading: "Data security", body: ["We use encryption in transit and at rest, role-based access controls, and regular security reviews to protect your data."] },
        { heading: "Your rights", body: ["You may request access to, correction of, or deletion of your personal data at any time by contacting us."] },
        { heading: "Contact", body: ["Questions about this policy? Email privacy@ecomstrait.com."] },
      ]}
    />
  );
}
