import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { XIcon, LinkedInIcon, YouTubeIcon, InstagramIcon } from "@/components/ui/social-icons";
import { footerNav, siteConfig } from "@/lib/site";

const socialIcons = [
  { icon: XIcon, href: siteConfig.socials.twitter, label: "X" },
  { icon: LinkedInIcon, href: siteConfig.socials.linkedin, label: "LinkedIn" },
  { icon: YouTubeIcon, href: siteConfig.socials.youtube, label: "YouTube" },
  { icon: InstagramIcon, href: siteConfig.socials.instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-950 text-ink-300">
      <div className="container-px py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <Logo invert />
            <p className="text-sm font-semibold text-brand-400">
              {siteConfig.tagline}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-ink-400">
              The AI-powered Commerce Operating System. Connect with verified
              suppliers, launch with AI, and grow — all from one platform.
            </p>
            <div className="flex items-center gap-2">
              {socialIcons.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-ink-300 transition hover:border-brand-500/50 hover:text-brand-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerNav.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-400 transition hover:text-brand-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Stay ahead with AI commerce insights
            </h3>
            <p className="mt-1 text-sm text-ink-400">
              Weekly tips, AI updates, and business guides. No spam.
            </p>
          </div>
          <NewsletterForm invert />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-ink-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <Mail className="h-4 w-4" /> {siteConfig.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
