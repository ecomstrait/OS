"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandCoins, X } from "lucide-react";
import { requestPayout } from "@/lib/wallet-actions";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20";
const labelClass = "grid gap-1 text-sm";

/**
 * "Withdraw" — a merchant picks an amount (capped at the pending payout
 * balance) and gives a bank account; an admin processes it manually by bank
 * transfer and uploads a receipt once done (see /admin/settlements). This
 * doesn't move money itself.
 */
export function WithdrawalForm({ pendingPayout }: { pendingPayout: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(pendingPayout.toFixed(2)));
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankRoutingCode, setBankRoutingCode] = useState("");
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        disabled={pendingPayout <= 0}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
      >
        <HandCoins className="h-3.5 w-3.5" /> Withdraw
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await requestPayout({
        amount: Number(amount),
        bankAccountName,
        bankName,
        bankAccountNumber,
        bankRoutingCode: bankRoutingCode || undefined,
        note: note || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800">Withdraw funds</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cancel" className="text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        Up to ${pendingPayout.toFixed(2)}. An admin will process this by bank transfer and upload a receipt once it&apos;s done.
      </p>

      <div className="mt-3 grid gap-3">
        <label className={labelClass}>
          <span className="text-ink-600">Amount (USD)</span>
          <input
            type="number"
            min={0.01}
            max={pendingPayout}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-ink-600">Account holder name</span>
          <input required value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-ink-600">Bank name</span>
          <input required value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-ink-600">Account number</span>
          <input required value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-ink-600">Routing / IFSC / SWIFT (optional)</span>
          <input value={bankRoutingCode} onChange={(e) => setBankRoutingCode(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-ink-600">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit withdrawal request
      </button>
    </form>
  );
}
