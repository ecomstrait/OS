"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, KeyRound, Loader2, X } from "lucide-react";
import { requestStoreTransfer } from "@/lib/store-actions";

/**
 * "Make it yours" — the merchant opens a Shopify account through our referral
 * link, then tells us which email it's on so we can transfer the store to them.
 *
 * The transfer itself is a manual step in Shopify; this captures the intent and
 * puts the store in the admin's transfer queue.
 */
export function MakeItYoursButton({
  storeId,
  referralUrl,
  requestedEmail,
  transferred,
}: {
  storeId: string;
  referralUrl: string;
  /** Set once a transfer has already been requested. */
  requestedEmail: string | null;
  transferred: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (transferred) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
        <Check className="h-3.5 w-3.5" /> Yours
      </span>
    );
  }

  if (requestedEmail) {
    return (
      <span
        title={`Transferring to ${requestedEmail}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
      >
        <Loader2 className="h-3.5 w-3.5" /> Transfer requested
      </span>
    );
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await requestStoreTransfer(storeId, email);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-ink-800"
      >
        <KeyRound className="h-3.5 w-3.5" /> Make it yours
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => !pending && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-ink-100 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-bold text-ink-950">Make this store yours</p>
              <button
                onClick={() => !pending && setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-4 flex flex-col gap-3 text-sm text-ink-600">
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">
                  1
                </span>
                <span>
                  Create your Shopify account.
                  <a
                    href={referralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                  >
                    Start free trial <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">
                  2
                </span>
                <span>Tell us the email on that account.</span>
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">
                  3
                </span>
                <span>We transfer the store over — products, theme and content intact.</span>
              </li>
            </ol>

            <label className="mt-4 block text-xs font-semibold text-ink-700">
              Your Shopify account email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@example.com"
                className="mt-1.5 h-10 w-full rounded-xl border border-ink-200 px-3 text-sm font-normal outline-none focus:border-brand-400"
              />
            </label>

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-ink-400">
              Shopify bills the store once it&apos;s on your account and off its trial.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || email.trim().length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Request transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
