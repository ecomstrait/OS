"use client";

import type { Storefront } from "@/lib/storefront";
import type { PageDetail } from "@/lib/pages-api";
import type { StorefrontNavLink } from "@/lib/storefront-api";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

/** A custom page (Contact Us, FAQ, ...) created through the EcomAI chat — same minimal-markup convention as a blog post. */
export function PageView({
  store,
  navLinks,
  page,
  basePath,
  previewMode,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  page: PageDetail;
  basePath: string;
  /** See StorefrontChrome — set inside the Store Builder's preview. */
  previewMode?: boolean;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const paragraphs = page.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="min-h-screen"
      style={{ ...tokenStyle(t), background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-body)" }}
    >
      <StorefrontChrome store={store} navLinks={navLinks} basePath={basePath} previewMode={previewMode}>
        <article className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
          >
            {page.title}
          </h1>
          {paragraphs.length > 0 ? (
            <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed opacity-85">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm opacity-60">Nothing here yet.</p>
          )}
        </article>
      </StorefrontChrome>
    </div>
  );
}
