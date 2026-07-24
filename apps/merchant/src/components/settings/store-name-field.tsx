"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Pencil } from "lucide-react";
import { setStoreName } from "@/lib/store-actions";

/** Inline editable store name shown in the settings store card header. */
export function StoreNameField({
  storeId,
  initial,
}: {
  storeId: string;
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value.trim() !== initial;

  function save() {
    setError(null);
    if (!dirty) {
      setEditing(false);
      return;
    }
    start(async () => {
      const res = await setStoreName(storeId, value);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        setEditing(false);
        router.refresh();
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-950">{value}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink-300 hover:text-ink-700"
          aria-label="Rename store"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {saved && <Check className="h-3.5 w-3.5 text-brand-600" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(initial);
            setEditing(false);
          }
        }}
        className="h-8 w-48 rounded-lg border border-ink-200 px-2 text-sm font-semibold outline-none focus:border-ai-400"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Save
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
