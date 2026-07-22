"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { RequestMessage } from "@ecomstrait/db/types";
import { addRequestMessage } from "@/lib/request-actions";

export function MessageThread({
  requestId,
  messages,
}: {
  requestId: string;
  messages: RequestMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const text = body;
    start(async () => {
      const res = await addRequestMessage(requestId, text);
      if (res?.error) {
        setError(res.error);
      } else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-sm text-ink-400">No messages yet.</p>}
        {messages.map((m) => {
          if (m.sender === "system") {
            return (
              <p key={m.id} className="text-center text-xs text-ink-400">
                {m.body}
              </p>
            );
          }
          const mine = m.sender === "supplier";
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-brand-500 text-white"
                    : "border border-ink-100 bg-white text-ink-800",
                )}
              >
                {!mine && <p className="mb-0.5 text-xs font-semibold text-ink-400">Store owner</p>}
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a reply to the store owner…"
          className="flex-1 rounded-xl border border-ink-200 bg-white p-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
