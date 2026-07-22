"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2 } from "lucide-react";
import { setPhoneVerified } from "@/lib/admin-actions";

export function PhoneVerifyToggle({
  id,
  verified,
  phone,
}: {
  id: string;
  verified: boolean;
  phone: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      await setPhoneVerified(id, !verified);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-sm">
        {verified ? (
          <Check className="h-4 w-4 text-brand-600" />
        ) : (
          <Circle className="h-4 w-4 text-ink-300" />
        )}
        <span className={verified ? "text-ink-800" : "text-ink-400"}>
          Phone verified{phone ? ` · ${phone}` : ""}
        </span>
      </span>
      <button
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : verified ? (
          "Unmark"
        ) : (
          "Mark verified"
        )}
      </button>
    </div>
  );
}
