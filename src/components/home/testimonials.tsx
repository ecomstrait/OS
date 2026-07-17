"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { testimonials } from "@/content/testimonials";
import { cn } from "@/lib/utils";

const AUTO_MS = 7000;
const EASE = [0.22, 1, 0.36, 1] as const;

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const count = testimonials.length;
  const active = testimonials[index];

  const go = useCallback(
    (next: number, direction: number) => {
      setDir(direction);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [paused, index, reduce, count]);

  return (
    <Section tone="dark" id="stories">
      <style>{`
        @keyframes tst-orb-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(24px,-18px,0) scale(1.12); } }
        @keyframes tst-orb-b { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-28px,20px,0) scale(1.08); } }
        @keyframes tst-pulse { 0%,100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 1; transform: scale(1.35); } }
      `}</style>

      <SectionHeading
        invert
        eyebrow="Success Stories"
        title="Suppliers grow. Stores thrive."
        description="Entrepreneurs and suppliers building real businesses on EcomStrait."
      />

      <div
        className="relative mx-auto mt-14 max-w-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Ambient live glow behind the card */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div
            className="absolute -left-16 top-4 h-64 w-64 rounded-full opacity-60 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.28), transparent 68%)",
              animation: reduce ? undefined : "tst-orb-a 12s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-16 bottom-0 h-64 w-64 rounded-full opacity-60 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.26), transparent 68%)",
              animation: reduce ? undefined : "tst-orb-b 14s ease-in-out infinite",
            }}
          />
        </div>

        {/* Card */}
        <div className="relative min-h-[380px] sm:min-h-[340px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={active.name}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -48 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="glass relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white/90 p-7 shadow-xl shadow-ink-950/5 sm:p-9"
            >
              {/* top row: quote mark + live badge + stars */}
              <div className="flex items-start justify-between">
                <Quote className="h-9 w-9 text-brand-200" />
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-500"
                      style={{ animation: reduce ? undefined : "tst-pulse 1.8s ease-in-out infinite" }}
                    />
                    Live
                  </span>
                  <Stars activeKey={active.name} reduce={!!reduce} />
                </div>
              </div>

              <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-ink-800 sm:text-xl">
                &ldquo;{active.quote}&rdquo;
              </blockquote>

              {active.metric && (
                <motion.p
                  key={`m-${active.name}`}
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25"
                >
                  <motion.span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-white/90"
                    animate={reduce ? {} : { opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {active.metric}
                </motion.p>
              )}

              <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-ink-800 to-ink-950 text-sm font-bold text-white shadow-md">
                  {active.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-950">{active.name}</p>
                  <p className="text-xs text-ink-500">
                    {active.role}, {active.company}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="relative mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => go(index - 1, -1)}
            aria-label="Previous testimonial"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2.5">
            {testimonials.map((t, i) => {
              const isActive = i === index;
              return (
                <button
                  key={t.name}
                  onClick={() => go(i, i > index ? 1 : -1)}
                  aria-label={`Show testimonial ${i + 1}: ${t.name}`}
                  aria-current={isActive}
                  className={cn(
                    "relative h-2.5 overflow-hidden rounded-full transition-all duration-300",
                    isActive ? "bg-brand-500/25" : "bg-ink-300 hover:bg-ink-400",
                  )}
                  style={{ width: isActive ? 40 : 10 }}
                >
                  {isActive && (
                    <motion.span
                      key={`${index}-${paused}-${reduce}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
                      initial={{ width: reduce ? "100%" : "0%" }}
                      animate={{ width: paused || reduce ? "100%" : "100%" }}
                      transition={{
                        duration: paused || reduce ? 0 : AUTO_MS / 1000,
                        ease: "linear",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => go(index + 1, 1)}
            aria-label="Next testimonial"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar thumbnails */}
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {testimonials.map((t, i) => {
            const isActive = i === index;
            return (
              <button
                key={`thumb-${t.name}`}
                onClick={() => go(i, i > index ? 1 : -1)}
                aria-label={`View ${t.name} from ${t.company}`}
                aria-current={isActive}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full text-xs font-bold transition-all duration-300",
                  isActive
                    ? "scale-110 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 ring-2 ring-brand-500 ring-offset-2 ring-offset-ink-50"
                    : "bg-white text-ink-600 shadow-sm ring-1 ring-ink-200 hover:scale-105 hover:text-ink-900",
                )}
              >
                {t.initials}
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/** Five stars that fill in sequence each time a testimonial becomes active. */
function Stars({ activeKey, reduce }: { activeKey: string; reduce: boolean }) {
  return (
    <div key={activeKey} className="flex gap-0.5" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, s) => (
        <motion.span
          key={s}
          initial={reduce ? false : { opacity: 0, scale: 0.4, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.35, delay: 0.15 + s * 0.1, ease: EASE }}
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        </motion.span>
      ))}
    </div>
  );
}
