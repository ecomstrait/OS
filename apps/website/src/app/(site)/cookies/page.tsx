import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How and why EcomStrait uses cookies and similar technologies across the website and supplier portal, and how to manage your preferences.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="July 2026"
      intro="This policy explains how EcomStrait uses cookies and similar technologies, the types we use, and how you can control them."
      sections={[
        {
          heading: "What are cookies",
          body: [
            "Cookies are small text files stored on your device when you visit a site. Similar technologies (like local storage) work in comparable ways. They help a site remember you, keep you signed in, and understand how it's used.",
          ],
        },
        {
          heading: "How we use cookies",
          body: [
            "Essential cookies: required to run the Platform. In the supplier portal, these keep you securely signed in — our authentication provider stores your session so you don't have to log in on every page. The Platform can't function without them.",
            "Preference cookies: remember choices such as dismissing a banner, so your experience stays consistent.",
            "Analytics: we use lightweight, first-party event tracking to understand which parts of the site are useful (for example, how often the AI builder is used). This helps us improve the product.",
          ],
        },
        {
          heading: "Third-party cookies",
          body: [
            "We keep third-party cookies to a minimum. If we add an external analytics or tag-management tool in the future, we'll update this policy and, where required, ask for your consent.",
          ],
        },
        {
          heading: "Managing cookies",
          body: [
            "You can control or delete cookies through your browser settings, and set your browser to warn you before accepting them. Note that disabling essential cookies will prevent you from signing in to the supplier portal and may break parts of the site.",
          ],
        },
        {
          heading: "Do Not Track",
          body: [
            "Some browsers offer a “Do Not Track” signal. There's no common standard for how sites should respond, so we currently don't alter our behaviour based on it, but we keep non-essential tracking minimal by design.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We may update this policy as the Platform evolves. Changes will be posted here with a revised date.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about our use of cookies? Email privacy@ecomstrait.com."],
        },
      ]}
    />
  );
}
