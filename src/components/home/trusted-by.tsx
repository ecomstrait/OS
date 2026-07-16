"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { trustedLogos } from "@/content/testimonials";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function TrustedBy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  // Duplicate for a seamless loop; a single set is enough when motion is off.
  const strip = reduce ? trustedLogos : [...trustedLogos, ...trustedLogos];

  return (
    <section ref={ref} className="border-y border-ink-100 bg-white py-10">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Built on and trusted by the tools you already know
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
            <span className="relative flex h-1.5 w-1.5">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
            </span>
            {trustedLogos.length}+ integrations · live
          </span>
        </motion.div>

        {/* Soft edge mask + continuous scroll; hover pauses the strip. */}
        <div
          className="group relative flex overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div
            className={cn(
              "flex shrink-0 items-center",
              reduce
                ? "flex-wrap justify-center gap-y-3"
                : "animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]",
            )}
          >
            {strip.map((logo, i) => (
              <span
                key={`${logo}-${i}`}
                className="mx-8 whitespace-nowrap text-2xl font-bold tracking-tight text-ink-300 transition-all duration-300 hover:scale-110 hover:text-ink-700 sm:mx-12"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
