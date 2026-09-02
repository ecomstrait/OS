"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, Undo2 } from "lucide-react";
import type { SupplierStatus } from "@ecomstrait/db/types";
import { approveSupplier, rejectSupplier, returnToPending } from "@/lib/admin-actions";
import { RETURN_CHECKLIST } from "@/lib/onboarding";

export function AdminActions({ id, status }: { id: string; status: SupplierStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function toggleReason(key: string) {
    setReasons((r) => (r.includes(key) ? r.filter((k) => k !== key) : [...r, key]));
  }

  function sendReturn() {
    setError(null);
    start(async () => {
      const res = await returnToPending(id, { reasons, note });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setReturning(false);
      setReasons([]);
      setNote("");
      router.refresh();
    });
  }

  if (returning) {
    const canSend = reasons.length > 0 || note.trim().length > 0;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-500">What needs fixing?</p>
          <button type="button" onClick={() => setReturning(false)} className="text-ink-400 hover:text-ink-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {RETURN_CHECKLIST.map((item) => (
            <li key={item.key}>
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={reasons.includes(item.key)}
                  onChange={() => toggleReason(item.key)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500"
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-ink-600">Note (shown to the supplier)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Anything else they should know…"
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={sendReturn}
          disabled={pending || !canSend}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
          Send back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run(() => approveSupplier(id))}
          disabled={pending || status === "approved"}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </button>
        <button
          onClick={() => run(() => rejectSupplier(id))}
          disabled={pending || status === "rejected"}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => {
            setError(null);
            setReturning(true);
          }}
          disabled={pending || status === "pending"}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4" /> Return for edits
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
