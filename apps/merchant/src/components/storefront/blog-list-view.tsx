"use client";

import Link from "next/link";
import type { Storefront } from "@/lib/storefront";
import type { PostSummary } from "@/lib/blog-api";
import type { StorefrontNavLink } from "@/lib/storefront-api";
import { storeTokens, tokenStyle } from "@/lib/theme-tokens";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function BlogListView({
  store,
  navLinks,
  posts,
  basePath,
}: {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  posts: PostSummary[];
  basePath: string;
}) {
  const t = storeTokens(store.theme, store.plan.brandColors);
  const surface = "color-mix(in srgb, var(--ink) 4%, var(--bg))";

  return (
    <div
      className="min-h-screen"
      style={{ ...tokenStyle(t), background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-body)" }}
    >
      <StorefrontChrome store={store} navLinks={navLinks} basePath={basePath}>
        <section className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
          <h1
            className="text-2xl font-semibold sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
          >
            Journal
          </h1>

          {posts.length === 0 ? (
            <p className="mt-10 text-sm opacity-60">Nothing published yet — check back soon.</p>
          ) : (
            <div className="mt-10 flex flex-col gap-10">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`${basePath}/blog/${p.slug}`}
                  className={p.coverImage ? "group grid gap-5 sm:grid-cols-[200px_1fr]" : "group block"}
                >
                  {p.coverImage && (
                    <div className="aspect-[4/3] overflow-hidden" style={{ background: surface, borderRadius: "var(--radius)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase opacity-50" style={{ letterSpacing: "0.08em" }}>
                      {formatDate(p.publishedAt)}
                    </p>
                    <h2
                      className="mt-2 text-lg font-semibold transition group-hover:opacity-70"
                      style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.01em" }}
                    >
                      {p.title}
                    </h2>
                    {p.excerpt && <p className="mt-2 text-sm leading-relaxed opacity-70">{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </StorefrontChrome>
    </div>
  );
}
