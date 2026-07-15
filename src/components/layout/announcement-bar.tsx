"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 text-white">
      <div className="container-px flex items-center justify-center gap-3 py-2.5 text-sm">
        <Sparkles className="hidden h-4 w-4 text-brand-400 sm:block" />
        <p className="text-center text-ink-100">
          <span className="font-semibold text-white">Launch Offer</span> — the
          first 100 suppliers receive premium access.{" "}
          <Link
            href="/suppliers"
            className="font-semibold text-brand-400 underline-offset-4 hover:underline"
          >
            Learn more →
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-4 rounded-md p-1 text-ink-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
