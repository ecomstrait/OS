"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import type { Stat } from "@/content/stats";

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  const isFloat = !Number.isInteger(target);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return isFloat ? value.toFixed(1) : Math.round(value).toLocaleString();
}

export function StatCounter({ stat, invert }: { stat: Stat; invert?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const display = useCountUp(stat.value, inView);

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <div
        className={`text-4xl font-extrabold tracking-tight font-display sm:text-5xl ${
          invert ? "text-white" : "text-ink-950"
        }`}
      >
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <div className={invert ? "text-sm text-ink-300" : "text-sm text-ink-500"}>
        {stat.label}
      </div>
    </div>
  );
}
