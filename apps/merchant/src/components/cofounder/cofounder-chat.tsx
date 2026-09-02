"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { askCoFounderAction } from "@/lib/cofounder-actions";
import type { CoFounderTurn } from "@/lib/cofounder-ai";
import { ChatMarkdown } from "@/components/cofounder/chat-markdown";

type Message = CoFounderTurn;

export function CoFounderChat({ businessName }: { businessName: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    start(async () => {
      const res = await askCoFounderAction(messages, text);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-ink-700">
                Hi{businessName ? `, ${businessName}` : ""} — I&apos;m your AI co-founder.
              </p>
              <p className="mt-1 max-w-sm text-sm text-ink-400">
                Ask me about your revenue trend, which store is winning, orders stuck on low
                credits, or how to grow — I only work from your real numbers.
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "whitespace-pre-wrap bg-brand-500 text-white" : "bg-ink-50 text-ink-800"
              }`}
            >
              {m.role === "assistant" ? <ChatMarkdown text={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <p className="border-t border-ink-50 px-5 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your co-founder anything about the business…"
          disabled={pending}
          className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
