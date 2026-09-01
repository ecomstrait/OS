"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { AiAvatar } from "@/components/ecomai/ai-avatar";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/ask";
import { ASK_SUGGESTIONS } from "@/content/ask-suggestions";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I'm EcomAI, your ecommerce co-founder. Ask me anything about building, launching, or growing your online business.",
};

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-ai-300"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

export function AskEcomAI() {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"preset" | "groq" | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the conversation pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, loading, reduce]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json();
      const answer: string =
        typeof data?.answer === "string" && data.answer.trim()
          ? data.answer.trim()
          : "Sorry — something went wrong on my end. Please try again.";
      setSource(data?.source === "groq" ? "groq" : "preset");
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't reach my brain just now — please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      // Return focus to the composer for a natural back-and-forth.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.5), rgba(16,185,129,0.35), transparent 70%)",
        }}
      />

      <div className="container-px relative py-10 sm:py-14">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 shadow-2xl shadow-ink-950/50 backdrop-blur">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex items-center gap-3">
              <AiAvatar size={44} online />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  EcomAI
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    Online
                  </span>
                </p>
                <p className="text-xs text-ink-300">Your AI ecommerce co-founder</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([GREETING]);
                setSource(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New chat
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={cn("flex items-end gap-2.5", m.role === "user" && "flex-row-reverse")}
              >
                {m.role === "assistant" ? (
                  <AiAvatar size={30} />
                ) : (
                  <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-white/10 text-[11px] font-bold text-ink-100">
                    You
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20"
                      : "rounded-bl-md border border-white/10 bg-white/[0.06] text-ink-100",
                  )}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex items-end gap-2.5">
                <AiAvatar size={30} />
                <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Suggested prompts */}
            {showSuggestions && !loading && (
              <div className="pt-2">
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-300">
                  <Sparkles className="h-3.5 w-3.5 text-ai-300" /> Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {ASK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs text-ink-100 transition-colors hover:border-ai-400/60 hover:bg-ai-500/10 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-ink-950/60 px-3 py-2 focus-within:border-ai-400/60">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask EcomAI anything…"
                className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-ink-400 focus:outline-none"
              />
              <button
                onClick={() => void send(input)}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ai-500 to-ai-600 text-white shadow-lg shadow-ai-500/30 transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <AnimatePresence>
              <motion.p
                key={source ?? "hint"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-center text-[11px] text-ink-400"
              >
                {source === "groq"
                  ? "Powered by EcomAI (Groq · Llama) — simulated preview, features roll out in beta."
                  : "Simulated preview — EcomAI answers are illustrative; features roll out in beta."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Waitlist nudge */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
          <p className="text-sm text-ink-300">Ready to let EcomAI build your business?</p>
          <Button href="/#builder" size="sm">
            Watch AI build a business
          </Button>
        </div>
      </div>
    </section>
  );
}
