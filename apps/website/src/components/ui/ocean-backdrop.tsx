"use client";

import { motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Ocean backdrop — night strait with animated wave layers            */
/*  Shared across the homepage hero and every interior page header.     */
/* ------------------------------------------------------------------ */

/** Build a seamless, tileable wave path (2 identical tiles of `tile` px). */
function wavePath(baseline: number, amp: number, period: number) {
  const tile = 1440;
  const width = tile * 2;
  let d = `M 0 ${baseline}`;
  for (let x = 0; x < width; x += period) {
    d += ` q ${period / 4} ${-amp} ${period / 2} 0 q ${period / 4} ${amp} ${period / 2} 0`;
  }
  d += ` L ${width} 320 L 0 320 Z`;
  return d;
}

const WAVE_LAYERS = [
  { baseline: 150, amp: 16, period: 480, opacity: 0.22, duration: 22 },
  { baseline: 180, amp: 22, period: 720, opacity: 0.3, duration: 16 },
  { baseline: 214, amp: 30, period: 960, opacity: 0.4, duration: 11 },
];

/**
 * Animated "night strait" ocean that sits in the lower half of a dark section.
 * Drop it in as the first child of a `relative overflow-hidden` dark section.
 */
export function OceanBackdrop({ accentHex = "#3b82f6" }: { accentHex?: string }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep-water vertical gradient sitting in the lower half */}
      <motion.div
        key={`water-${accentHex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-x-0 bottom-0 top-[46%]"
        style={{
          background: `linear-gradient(to bottom, ${accentHex}00 0%, ${accentHex}22 26%, ${accentHex}3d 60%, #0b1327 100%)`,
        }}
      />

      {/* Animated wave layers */}
      <div className="absolute inset-x-0 bottom-0 h-[54%]">
        {WAVE_LAYERS.map((w, i) => (
          <motion.div
            key={i}
            className="absolute inset-x-0 bottom-0 h-full w-[200%]"
            animate={reduce ? {} : { x: ["0%", "-50%"] }}
            transition={{ duration: w.duration, repeat: Infinity, ease: "linear" }}
          >
            <svg
              viewBox="0 0 2880 320"
              preserveAspectRatio="none"
              className="h-full w-full"
              style={{ opacity: w.opacity }}
            >
              <path d={wavePath(w.baseline, w.amp, w.period)} fill={accentHex} />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Reflection shimmer on the water surface */}
      {!reduce && (
        <motion.div
          className="absolute inset-x-0 top-[46%] h-40"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accentHex}55, transparent 70%)` }}
        />
      )}

      {/* Deep-water fade so the section settles into dark navy at the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgba(11,19,39,0), #0b1327 88%)" }}
      />
    </div>
  );
}
