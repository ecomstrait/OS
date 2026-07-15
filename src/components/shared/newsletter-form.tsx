"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Newsletter capture. Client-side only for now — wire to an API/CRM later. */
export function NewsletterForm({
  invert = false,
  className,
}: {
  invert?: boolean;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  }

  if (done) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium",
          invert ? "bg-white/10 text-white" : "bg-brand-50 text-brand-700",
          className,
        )}
      >
        <Check className="h-4 w-4" /> You&apos;re subscribed. Welcome aboard!
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full max-w-md items-center gap-2 rounded-full border p-1.5",
        invert
          ? "border-white/15 bg-white/5"
          : "border-ink-200 bg-white",
        className,
      )}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        aria-label="Email address"
        className={cn(
          "min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-ink-400",
          invert ? "text-white" : "text-ink-950",
        )}
      />
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Subscribe
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
