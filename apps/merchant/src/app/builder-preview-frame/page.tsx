"use client";

import { useEffect, useState } from "react";
import { StorefrontView, type CategoryBand } from "@/components/storefront/storefront-view";
import type { Storefront } from "@/lib/storefront";
import type { StorefrontNavLink } from "@/lib/storefront-api";
import { BUILDER_PREVIEW_READY, BUILDER_PREVIEW_DATA } from "@/lib/builder-preview-protocol";

/**
 * Bare preview target for the Store Builder (components/builder/store-builder.tsx),
 * used two ways:
 *
 *  - Embedded in the builder's own preview pane as an <iframe> — the device
 *    toggle there resizes this frame, not a container. Why an iframe and not
 *    just a width-constrained <div>: Tailwind's `sm:`/`md:` responsive
 *    classes compile to `@media (min-width: …)`, which is evaluated against
 *    the real browsing-context viewport — narrowing an ancestor <div>'s
 *    `max-width` never triggers them (that's what CSS container queries are
 *    for, and this codebase doesn't use them). An <iframe> is the one thing
 *    in HTML that gets its own real, independent viewport sized to its own
 *    rendered width, so putting the actual StorefrontView tree in one here
 *    is what makes that toggle genuinely show the mobile/tablet layout.
 *  - Opened directly via `window.open()` by the builder's "Live Preview"
 *    button — a full-tab look at the current draft, for a store that isn't
 *    published yet (or whose published version is behind the edits being
 *    made). Same page, same protocol: it doesn't care which one opened it.
 *
 * No server data, no auth: everything it renders arrives via postMessage
 * from whichever window opened it (the builder's live, unsaved draft
 * state), so this route needs nothing of its own and is safe to load
 * unauthenticated.
 */

type Payload = {
  store: Storefront;
  navLinks: StorefrontNavLink[];
  categoryBands: CategoryBand[];
};

const READY = BUILDER_PREVIEW_READY;
const DATA = BUILDER_PREVIEW_DATA;

/** The window that can plausibly have opened us: `window.open()` sets
 *  `opener`; being embedded as an <iframe> sets `parent` (≠ self). Neither
 *  is set when this URL is visited directly — then there's nothing to talk
 *  to, and the page just never receives data. */
function host(): Window | null {
  if (window.opener) return window.opener as Window;
  if (window.parent !== window) return window.parent;
  return null;
}

export default function BuilderPreviewFramePage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  // A real new tab (not an <iframe>) — worth a banner so a merchant can't
  // mistake unsaved edits for the actual published site.
  const standalone = typeof window !== "undefined" && window.self === window.top;

  useEffect(() => {
    const h = host();
    if (!h) return;
    function onMessage(e: MessageEvent) {
      // Only the window that opened us, same-origin — this page is not
      // meant to be embedded/opened from anywhere else, and blindly
      // trusting postMessage from any origin would let another page in the
      // same browser feed it content.
      if (e.origin !== window.location.origin || e.source !== h) return;
      if (e.data?.type !== DATA) return;
      setPayload(e.data.payload as Payload);
    }
    window.addEventListener("message", onMessage);
    h.postMessage({ type: READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (payload?.store.name) document.title = `${payload.store.name} — Live preview`;
  }, [payload?.store.name]);

  if (!payload) return null;

  return (
    <div>
      {standalone && (
        <div className="sticky top-0 z-50 bg-ink-950 px-4 py-2 text-center text-xs font-semibold text-white">
          Live preview — shows your latest unsaved changes, not necessarily what&apos;s published.
        </div>
      )}
      <div
        // This is a preview, not a real page to navigate away into — there's
        // no store behind it, so every link is inert.
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a")) e.preventDefault();
        }}
      >
        <StorefrontView
          store={payload.store}
          navLinks={payload.navLinks}
          categoryBands={payload.categoryBands}
          basePath="/store/preview"
          previewMode
        />
      </div>
    </div>
  );
}
