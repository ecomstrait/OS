import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EcomStrait collects, uses, shares, and protects your personal information across the EcomAI platform, supplier portal, and website.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      intro="This policy explains what information EcomStrait collects, how EcomAI uses it, who we share it with, and the choices and rights you have."
      sections={[
        {
          heading: "Who we are",
          body: [
            "EcomStrait (“we”, “us”, “our”) builds EcomAI, an AI ecommerce co-founder that helps entrepreneurs launch online stores and helps suppliers reach them. This policy covers our marketing website, the supplier portal, and related services.",
            "EcomAI is currently in beta. We may update our practices as the product evolves and will reflect material changes here.",
          ],
        },
        {
          heading: "Information we collect",
          body: [
            "Account information: when you sign up as a supplier (or join a waitlist), we collect your name, email, and password credentials handled by our authentication provider.",
            "Business & onboarding information: for suppliers, we collect business details you provide during onboarding — company name, contact, phone, location, product categories, and verification documents you upload (e.g. registration, ID, address proof).",
            "Content you create: products, catalog data, images, and inventory you add to the platform.",
            "Messages & submissions: information you send through contact, lead, newsletter, or waitlist forms, including the business idea you describe to EcomAI.",
            "Usage & device data: we record lightweight analytics events (such as when an idea is submitted or a waitlist is joined), along with standard technical data like IP address, browser type, and pages viewed.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "To provide and operate the platform — create and secure your account, run the supplier portal, and deliver the features you use.",
            "To power EcomAI — process the business ideas and product details you submit to generate store previews, business plans, product copy, SEO, and recommendations.",
            "To verify suppliers — review the details and documents you submit so store owners can trust who they buy from.",
            "To communicate with you — respond to enquiries, send transactional emails, and (if you opt in) send Founders Waitlist updates and product news. You can unsubscribe from marketing emails at any time.",
            "To improve and secure the service — understand usage, prevent abuse, and debug issues.",
            "We do not sell your personal information.",
          ],
        },
        {
          heading: "AI and your data",
          body: [
            "EcomAI is powered by third-party large language models. When you submit a business idea or product details, that text is sent to our AI provider to generate a response, then returned to you as a labelled, simulated preview.",
            "Please don't include sensitive personal information (such as government IDs, health, or financial account numbers) in free-text prompts. Verification documents are handled separately and stored privately (see “How we protect your data”).",
          ],
        },
        {
          heading: "How we share information",
          body: [
            "We share data with service providers who process it on our behalf under contract, including: our hosting, database, authentication, and file-storage provider (Supabase); our transactional email provider (Resend); and our AI provider (Groq) which processes prompts to generate EcomAI responses.",
            "We may disclose information if required by law, to protect our rights and users, or in connection with a merger, acquisition, or sale of assets.",
            "We never sell your personal data or share it with advertisers.",
          ],
        },
        {
          heading: "How we protect your data",
          body: [
            "Data is encrypted in transit and at rest. Access is restricted with row-level security so each account can only reach its own records, and supplier documents are kept in a private storage bucket accessible only to you and authorised reviewers via short-lived signed links.",
            "No system is perfectly secure, but we review our practices regularly and limit access to what's necessary.",
          ],
        },
        {
          heading: "Data retention",
          body: [
            "We keep personal information for as long as your account is active or as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements. You can ask us to delete your data (see “Your rights”).",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Depending on where you live, you may have the right to access, correct, export, or delete your personal data, and to object to or restrict certain processing.",
            "To exercise any of these rights, email privacy@ecomstrait.com and we'll respond within a reasonable timeframe.",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "Our providers may process data in countries other than yours. Where required, we rely on appropriate safeguards for such transfers.",
          ],
        },
        {
          heading: "Children",
          body: [
            "EcomStrait is intended for people aged 18 and over and is not directed at children. We do not knowingly collect data from minors.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We may update this policy from time to time. Material changes will be posted here with a revised “last updated” date.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about your privacy or this policy? Email privacy@ecomstrait.com.",
          ],
        },
      ]}
    />
  );
}
