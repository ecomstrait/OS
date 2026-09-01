"use client";

import type { Storefront } from "@/lib/storefront";
import type { PostDetail } from "@/lib/blog-api";
import type { StorefrontNavLink } from "@/lib/storefront-api";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

export function BlogPostView({
  store,
  navLinks,
  post,
  basePath,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  post: PostDetail;
  basePath: string;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";
  // Same minimal-markup convention as the rest of a plan's text fields —
  // paragraphs separated by a blank line, no rich-text/HTML to sanitize.
  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="min-h-screen"
      style={{ ...tokenStyle(t), background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-body)" }}
    >
      <StorefrontChrome store={store} navLinks={navLinks} basePath={basePath}>
        <article className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
          <a
            href={`${basePath}/blog`}
            className="mb-8 inline-block text-xs font-semibold uppercase opacity-60 hover:opacity-100"
            style={{ letterSpacing: "0.08em" }}
          >
            ← Back to journal
          </a>
          <p className="text-xs uppercase opacity-50" style={{ letterSpacing: "0.08em" }}>
            {new Date(post.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1
            className="mt-2 text-3xl font-semibold"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
          >
            {post.title}
          </h1>

          {post.coverImage && (
            <div className="mt-8 aspect-[16/9] overflow-hidden" style={{ background: surface, borderRadius: "var(--radius)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed opacity-85">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>
      </StorefrontChrome>
    </div>
  );
}
