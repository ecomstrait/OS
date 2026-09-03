"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";

/**
 * Shown in place of (or alongside) an inline error whenever a server action
 * fails because the plan ran out of something — AI tokens for the day, or the
 * plan's catalog limit — instead of leaving the supplier to read fine print
 * in a red banner. `message` is the same string the server action already
 * produced (see entitlements.ts), so the copy stays in one place.
 */
export function UpgradeModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-ai-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-base font-bold text-ink-950">Time to upgrade</p>
        <p className="mt-1 text-sm text-ink-600">{message}</p>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-ink-200 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            Not now
          </button>
          <Link
            href="/billing"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
          >
            Upgrade plan
          </Link>
        </div>
      </div>
    </div>
  );
}
