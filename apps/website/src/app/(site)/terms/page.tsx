import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your access to and use of the EcomStrait platform, EcomAI, and the supplier portal.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="July 2026"
      intro="These terms govern your use of EcomStrait, EcomAI, and the supplier portal. Please read them carefully — by using the platform you agree to them."
      sections={[
        {
          heading: "Agreement to terms",
          body: [
            "By accessing or using EcomStrait, EcomAI, or the supplier portal (the “Platform”), you agree to be bound by these Terms of Service. If you do not agree, please don't use the Platform.",
          ],
        },
        {
          heading: "Eligibility",
          body: [
            "You must be at least 18 years old and able to form a binding contract. If you use the Platform on behalf of a business, you confirm you're authorised to bind that business to these terms.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You're responsible for keeping your login credentials secure and for all activity under your account. Provide accurate information and keep it up to date.",
            "Suppliers must complete onboarding and verification before publishing products. We may approve, decline, or revoke supplier access at our discretion, for example if information can't be verified.",
          ],
        },
        {
          heading: "Beta service and simulated previews",
          body: [
            "EcomAI is in beta and provided for preview and evaluation. Features may change, break, or be removed.",
            "EcomAI outputs — store previews, business plans, product copy, supplier counts, margins, revenue figures, and other numbers — are AI-generated suggestions and illustrative example ranges. They are not advice, guarantees, or promises of results, earnings, or income. Your actual results will vary and depend on many factors outside our control.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Use the Platform lawfully. Don't misuse it, attempt to disrupt or reverse-engineer it, infringe others' rights, upload unlawful or infringing content, or use it to sell prohibited, counterfeit, or unsafe goods.",
          ],
        },
        {
          heading: "Suppliers and content",
          body: [
            "Suppliers are responsible for the accuracy of their catalog, pricing, inventory, and for lawfully supplying and fulfilling the products they list. Store owners are responsible for their storefront content and customer relationships.",
            "You represent that you have the rights to any content, images, and trademarks you upload.",
          ],
        },
        {
          heading: "Fees, subscriptions & billing",
          body: [
            "Some features may require paid subscriptions or fees. Pricing and billing terms will be presented before you purchase. During beta, features and pricing may change.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "You retain ownership of your brand, catalog, and content. You grant us a limited licence to host, process, and display that content as needed to operate the Platform.",
            "EcomStrait retains all rights in the Platform, software, EcomAI, and underlying technology.",
          ],
        },
        {
          heading: "Third-party services",
          body: [
            "The Platform relies on third-party providers (for hosting, authentication, email, payments, and AI). Your use may be subject to their terms, and we're not responsible for their acts or omissions.",
          ],
        },
        {
          heading: "Disclaimers",
          body: [
            "The Platform is provided “as is” and “as available,” without warranties of any kind. We don't warrant that it will be uninterrupted, error-free, or that any result, outcome, or income will be achieved.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the maximum extent permitted by law, EcomStrait is not liable for any indirect, incidental, special, consequential, or lost-profit damages arising from your use of the Platform.",
          ],
        },
        {
          heading: "Indemnification",
          body: [
            "You agree to indemnify EcomStrait against claims arising from your content, your products, or your misuse of the Platform.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "You may stop using the Platform at any time. We may suspend or terminate access if you breach these terms or to protect the Platform and its users.",
          ],
        },
        {
          heading: "Governing law & changes",
          body: [
            "These terms are governed by the laws of the jurisdiction in which EcomStrait operates. We may update these terms; material changes will be posted here with a new effective date, and continued use means you accept them.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about these terms? Email legal@ecomstrait.com."],
        },
      ]}
    />
  );
}
