"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createWalletTopupSession } from "@/lib/wallet-actions";

export function WalletTopupForm() {
  const [amount, setAmount] = useState("25");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(amount);
    start(async () => {
      const res = await createWalletTopupSession(parsed);
      if (res.error) setError(res.error);
      else if (res.url) window.location.href = res.url;
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-ink-600">Amount (USD)</span>
        <input
          type="number"
          min={1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Add credits
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
