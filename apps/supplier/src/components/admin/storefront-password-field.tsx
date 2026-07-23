"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { setStorefrontPassword } from "@/lib/admin-actions";

export function StorefrontPasswordField({
  shopifyStoreId,
  initial,
}: {
  shopifyStoreId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== (initial ?? "");

  function onSave() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await setStorefrontPassword(shopifyStoreId, value);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="storefront password"
        className="h-8 w-40 rounded-lg border border-ink-200 bg-white px-2 font-mono text-sm outline-none focus:border-ai-400"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={pending || !dirty}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-ai-500 px-3 text-sm font-semibold text-white hover:bg-ai-600 disabled:opacity-40"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : saved && !dirty ? (
          <Check className="h-3.5 w-3.5" />
        ) : null}
        Save
      </button>
    </div>
  );
}
