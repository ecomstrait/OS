"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence, motion, useInView, useReducedMotion,
} from "framer-motion";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Accordion, type FaqItem } from "@/components/ui/accordion";
import { homeFaqs } from "@/content/faqs";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Trim a question down to a compact chip label. */
function shorten(q: string) {
  const clean = q.replace(/[?.]+$/, "");
  return clean.length > 26 ? `${clean.slice(0, 25).trimEnd()}…` : clean;
}

export function FaqSection({
  items = homeFaqs,
  tone = "muted",
}: {
  items?: FaqItem[];
  tone?: "light" | "muted";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });

  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);

  const trimmed = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!trimmed) return items;
    return items.filter(
      (f) =>
        f.question.toLowerCase().includes(trimmed) ||
        f.answer.toLowerCase().includes(trimmed),
    );
  }, [items, trimmed]);

  const noMatch = trimmed !== "" && filtered.length === 0;

  // EcomAI "typing" beat before an answer resolves — echoes the dual-audience chat.
  useEffect(() => {
    if (!trimmed) {
      const off = setTimeout(() => setThinking(false), 0);
      return () => clearTimeout(off);
    }
    if (reduce) {
      const off = setTimeout(() => setThinking(false), 0);
      return () => clearTimeout(off);
    }
    const on = setTimeout(() => setThinking(true), 0);
    const off = setTimeout(() => setThinking(false), 780);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [trimmed, reduce]);

  const chips = useMemo(() => items.slice(0, 5), [items]);

  return (
    <Section tone={tone} id="faqs">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know about launching and growing on EcomStrait. Can't find an answer? Reach out any time."
        />

        <motion.div
          ref={ref}
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-950/5"
        >
          {/* ---- Ask EcomAI header ---- */}
          <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-50/60 px-5 py-4">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ai-500 to-ai-700 text-white shadow-lg shadow-ai-500/30">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-ai-500"
                  animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.35, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <Sparkles className="relative h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-950">Ask EcomAI</p>
              <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                <span className="relative flex h-1.5 w-1.5">
                  {!reduce && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                  )}
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                </span>
                Online · answers from the FAQ instantly
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
            {/* greeting bubble */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ai-50 text-ai-600">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-2.5 text-[14px] leading-relaxed text-ink-600">
                Hi 👋 Ask me anything about EcomStrait — or tap a topic below.
              </div>
            </div>

            {/* ---- prompt bar ---- */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="group relative flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-ai-400 focus-within:ring-2 focus-within:ring-ai-500/20"
            >
              <Search className="h-4 w-4 shrink-0 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask EcomAI a question…"
                aria-label="Ask EcomAI a question"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <AnimatePresence>
                {query !== "" && (
                  <motion.button
                    type="button"
                    aria-label="Clear question"
                    onClick={() => setQuery("")}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* ---- suggested question chips ---- */}
            <div className="flex flex-wrap gap-2">
              {chips.map((f) => {
                const isActive = query === f.question;
                return (
                  <button
                    key={f.question}
                    type="button"
                    onClick={() => setQuery(isActive ? "" : f.question)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200",
                      isActive
                        ? "border-ai-500 bg-ai-500 text-white shadow-sm shadow-ai-500/25"
                        : "border-ink-200 bg-white text-ink-600 hover:border-ai-300 hover:bg-ai-50 hover:text-ai-700",
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {shorten(f.question)}
                  </button>
                );
              })}
            </div>

            {/* ---- answer area ---- */}
            <div className="min-h-[3rem]">
              <AnimatePresence mode="wait">
                {thinking ? (
                  <TypingBubble key="typing" />
                ) : noMatch ? (
                  <motion.div
                    key="nomatch"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ai-50 text-ai-600">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3 text-[14px] leading-relaxed text-ink-600">
                      Hmm, I don&apos;t have a saved answer for that one.{" "}
                      <a
                        href="/contact"
                        className="inline-flex items-center gap-1 font-semibold text-ai-600 hover:text-ai-700 hover:underline"
                      >
                        I&apos;ll connect you with the team
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={trimmed || "all"}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    {trimmed && (
                      <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-400">
                        <Sparkles className="h-3 w-3 text-ai-500" />
                        {filtered.length === 1
                          ? "Here's the answer"
                          : `Found ${filtered.length} related answers`}
                      </p>
                    )}
                    {/* key forces the Accordion to remount and open the top match */}
                    <Accordion key={trimmed || "all"} items={filtered} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2.5"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ai-50 text-ai-600">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-300"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
