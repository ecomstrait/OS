"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  TrendingUp, Boxes, Package, Bell, Sparkles, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

const EASE = [0.22, 1, 0.36, 1] as const;

const STATS: {
  icon: IconType;
  label: string;
  target: number;
  prefix?: string;
  tone: string;
}[] = [
  { icon: TrendingUp, label: "Revenue", target: 128400, prefix: "$", tone: "text-brand-600" },
  { icon: Boxes, label: "Orders", target: 3942, tone: "text-ai-600" },
  { icon: Package, label: "Products in sync", target: 1240, tone: "text-ink-900" },
  { icon: Bell, label: "Low-stock alerts", target: 6, tone: "text-amber-600" },
];

const FEED = [
  { store: "Bloom & Co.", item: "Organic Cotton Tee", qty: 120, amount: 1440 },
  { store: "Nord Supply", item: "Ceramic Mug Set", qty: 60, amount: 720 },
  { store: "Urban Threads", item: "Denim Jacket", qty: 45, amount: 2025 },
  { store: "Field Goods", item: "Trail Backpack", qty: 30, amount: 1170 },
  { store: "Aster Home", item: "Linen Throw", qty: 80, amount: 1600 },
  { store: "Maple Market", item: "Bamboo Cutlery", qty: 200, amount: 900 },
];

const REC =
  "Demand for “Organic Cotton Tee” is up 40%. Consider restocking 500 units this week.";

/* ------------------------------------------------------------------ */

export function SupplierDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE }}
      className="rounded-3xl border border-ink-100 bg-white p-5 shadow-xl shadow-ink-950/5"
    >
      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <StatTile key={s.label} stat={s} active={active} reduce={!!reduce} />
        ))}
      </div>

      {/* live incoming-orders feed */}
      <LiveFeed active={active} reduce={!!reduce} />

      {/* AI recommendation, typed out */}
      <AiRecommendation active={active} reduce={!!reduce} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Count-up stat tile                                                */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, active: boolean, reduce: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduce) {
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, reduce, duration]);
  return value;
}

function StatTile({
  stat,
  active,
  reduce,
}: {
  stat: (typeof STATS)[number];
  active: boolean;
  reduce: boolean;
}) {
  const value = useCountUp(stat.target, active, reduce);
  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <stat.icon className={cn("h-5 w-5", stat.tone)} />
      <p className="mt-3 font-display text-xl font-extrabold tabular-nums text-ink-950">
        {stat.prefix}
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-ink-500">{stat.label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live incoming-orders feed                                          */
/* ------------------------------------------------------------------ */

type FeedRow = (typeof FEED)[number] & { key: number };

function LiveFeed({ active, reduce }: { active: boolean; reduce: boolean }) {
  const [rows, setRows] = useState<FeedRow[]>(() =>
    FEED.slice(0, 3).map((o, i) => ({ ...o, key: i })),
  );
  const nextRef = useRef(3);

  useEffect(() => {
    if (!active || reduce) return;
    const t = setInterval(() => {
      setRows((cur) => {
        const src = FEED[nextRef.current % FEED.length];
        nextRef.current += 1;
        return [{ ...src, key: nextRef.current }, ...cur].slice(0, 3);
      });
    }, 2400);
    return () => clearInterval(t);
  }, [active, reduce]);

  return (
    <div className="mt-3 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-900">Incoming orders</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-brand-500"
            animate={reduce ? {} : { opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          Live
        </span>
      </div>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((r) => (
            <motion.li
              key={r.key}
              layout
              initial={reduce ? false : { opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={reduce ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex items-center gap-2.5 overflow-hidden rounded-lg bg-ink-50 px-2.5 py-2"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ai-500/10 text-ai-600">
                <Boxes className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink-800">{r.item}</p>
                <p className="truncate text-[11px] text-ink-400">
                  {r.qty} units · {r.store}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand-600">
                <ArrowUpRight className="h-3 w-3" />${r.amount.toLocaleString()}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI recommendation — typed out with a typing indicator             */
/* ------------------------------------------------------------------ */

function AiRecommendation({ active, reduce }: { active: boolean; reduce: boolean }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0 idle · 1 typing dots · 2 typing text
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!active) return;
    if (reduce) {
      const id = requestAnimationFrame(() => {
        setPhase(2);
        setTyped(REC);
      });
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setPhase(1));
    const t = setTimeout(() => setPhase(2), 900);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [active, reduce]);

  useEffect(() => {
    if (phase !== 2 || reduce) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(REC.slice(0, i));
      if (i >= REC.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [phase, reduce]);

  const done = typed.length >= REC.length;

  return (
    <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
        <Sparkles className="h-3.5 w-3.5" /> AI Recommendation
      </p>
      <div className="mt-1 min-h-[2.5rem] text-sm text-ink-700">
        {phase === 1 ? (
          <span className="inline-flex items-center gap-1 py-1.5" aria-label="EcomAI is typing">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-brand-400"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </span>
        ) : (
          <p>
            {typed}
            {!done && !reduce && (
              <motion.span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-0.5 -translate-y-px bg-brand-500 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
