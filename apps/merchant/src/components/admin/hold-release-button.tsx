"use client";

import { useTransition } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";
import type { WalletAccountType } from "@ecomstrait/db";
import { holdAccountPayables, releaseAccountPayables } from "@/lib/settlement-actions";

/** Toggles whether one account's pending payable_ledger rows are excluded from settlement runs. */
export function HoldReleaseButton({
  accountType,
  accountId,
  held,
}: {
  accountType: WalletAccountType;
  accountId: string;
  held: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (held) await releaseAccountPayables(accountType, accountId);
          else await holdAccountPayables(accountType, accountId);
        })
      }
      className={
        held
          ? "inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
          : "inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
      }
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : held ? (
        <Unlock className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      {held ? "Release" : "Hold"}
    </button>
  );
}
