"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Newsletter capture — persists to Supabase + notifies via /api/newsletter. */
export function NewsletterForm({
  invert = false,
  className,
  source,
}: {
  invert?: boolean;
  className?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const done = status === "done";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: source ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
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
    <div className={cn("w-full max-w-md", className)}>
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-full border p-1.5",
        invert
          ? "border-white/15 bg-white/5"
          : "border-ink-200 bg-white",
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
        disabled={status === "loading"}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Subscribe
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
    {status === "error" && (
      <p className={cn("mt-2 px-4 text-xs", invert ? "text-red-300" : "text-red-500")}>
        Something went wrong. Please try again.
      </p>
    )}
    </div>
  );
}
