"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createSampleRequest } from "@/lib/admin-actions";

export function SampleRequestButton({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      const res = await createSampleRequest(supplierId);
      setMsg(res?.error ?? "Sample request created.");
      if (!res?.error) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create sample request
      </button>
      {msg && <p className="text-xs text-ink-500">{msg}</p>}
    </div>
  );
}
