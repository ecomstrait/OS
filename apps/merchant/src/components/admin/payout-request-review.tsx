"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Upload } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { markPayoutRequestPaid, declinePayoutRequest } from "@/lib/settlement-actions";

const BUCKET = "payout-receipts";

/**
 * Admin review for one withdrawal request — shows the bank details needed
 * to actually send the transfer, then either uploads a receipt (client-side,
 * same direct-to-storage pattern as the avatar uploader) and marks it paid,
 * or declines it with an optional reason.
 */
export function PayoutRequestReview({
  requestId,
  bankAccountName,
  bankName,
  bankAccountNumber,
  bankRoutingCode,
}: {
  requestId: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankRoutingCode: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "paying" | "declining">("idle");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function markPaid() {
    if (!receipt) {
      setError("Attach a receipt first.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        const supabase = createClient();
        const ext = receipt.name.split(".").pop() || "png";
        const path = `${requestId}/receipt-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, receipt);
        if (upErr) throw upErr;
        const res = await markPayoutRequestPaid(requestId, path, note || undefined);
        if (res.error) throw new Error(res.error);
        setMode("idle");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't upload the receipt.");
      }
    });
  }

  function decline() {
    setError(null);
    start(async () => {
      const res = await declinePayoutRequest(requestId, note || undefined);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMode("idle");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-ink-500">
        <dt className="text-ink-400">Account holder</dt>
        <dd className="text-ink-700">{bankAccountName}</dd>
        <dt className="text-ink-400">Bank</dt>
        <dd className="text-ink-700">{bankName}</dd>
        <dt className="text-ink-400">Account #</dt>
        <dd className="text-ink-700">{bankAccountNumber}</dd>
        {bankRoutingCode && (
          <>
            <dt className="text-ink-400">Routing</dt>
            <dd className="text-ink-700">{bankRoutingCode}</dd>
          </>
        )}
      </dl>

      {mode === "idle" && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setMode("paying")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Check className="h-3.5 w-3.5" /> Mark paid
          </button>
          <button
            type="button"
            onClick={() => setMode("declining")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
          >
            <X className="h-3.5 w-3.5" /> Decline
          </button>
        </div>
      )}

      {mode === "paying" && (
        <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
            <Upload className="h-3.5 w-3.5" />
            {receipt ? receipt.name : "Attach receipt (image or PDF)"}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            />
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. wired Sep 10"
            className="mt-2 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setMode("idle"); setReceipt(null); setNote(""); setError(null); }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={markPaid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm paid
            </button>
          </div>
        </div>
      )}

      {mode === "declining" && (
        <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional) — shown to the requester"
            className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setMode("idle"); setNote(""); setError(null); }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={decline}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm decline
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-right text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
