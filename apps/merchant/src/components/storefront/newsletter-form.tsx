"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

/** Footer newsletter signup — one email field, posts straight to the store's own list. */
export function NewsletterForm({ storeId, previewMode }: { storeId: string; previewMode?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const line = "color-mix(in srgb, var(--ink) 20%, transparent)";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    // Inside the Store Builder's preview: no real store to subscribe to yet
    // (an unlaunched store's id is refused by the real API anyway, the same
    // way getStorefront refuses it) — skip the request entirely rather than
    // let a merchant testing the preview create a real subscriber row.
    if (previewMode) {
      setError("You'll be able to collect real signups once you launch.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`/api/storefront/${storeId}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "That didn't go through.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("That didn't go through — try again in a moment.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--brand)" }}>
        <Check className="h-3.5 w-3.5" /> You&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-2">
      <div className="flex w-full items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email address"
          className="h-10 min-w-0 flex-1 border bg-transparent px-3 text-sm outline-none"
          style={{ borderColor: line, borderRadius: "var(--radius)" }}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex h-10 shrink-0 items-center justify-center px-4 text-xs font-semibold uppercase text-white transition hover:opacity-85 disabled:opacity-50"
          style={{ background: "var(--brand)", borderRadius: "var(--radius)", letterSpacing: "0.06em" }}
        >
          {state === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
