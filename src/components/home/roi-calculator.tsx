"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion, useInView, useReducedMotion, useSpring, useTransform,
} from "framer-motion";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";

function currency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Number that springs to its value (counts up on view + on change)  */
/* ------------------------------------------------------------------ */

function AnimatedNumber({
  value,
  format,
  play,
}: {
  value: number;
  format: (n: number) => string;
  play: boolean;
}) {
  const reduce = useReducedMotion();
  const spring = useSpring(0, { stiffness: 90, damping: 18, mass: 0.8 });
  const text = useTransform(spring, (v) => format(v));

  useEffect(() => {
    if (reduce) return;
    spring.set(play ? value : 0);
  }, [spring, value, play, reduce]);

  if (reduce) return <>{format(value)}</>;
  return <motion.span>{text}</motion.span>;
}

/* ------------------------------------------------------------------ */
/*  Slider                                                             */
/* ------------------------------------------------------------------ */

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
};

function Slider({ label, value, min, max, step, onChange, format }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-ink-700">{label}</label>
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-bold text-brand-700 tabular-nums">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none transition-[background] duration-150 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(16,185,129,0.2)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
        style={{
          background: `linear-gradient(to right, var(--color-brand-500) ${pct}%, var(--color-ink-100) ${pct}%)`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ROI calculator                                                     */
/* ------------------------------------------------------------------ */

export function RoiCalculator() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const play = inView || !!reduce;

  const [investment, setInvestment] = useState(2000);
  const [aov, setAov] = useState(45);
  const [orders, setOrders] = useState(300);
  const [margin, setMargin] = useState(40);

  const result = useMemo(() => {
    const monthlyRevenue = aov * orders;
    const monthlyProfit = monthlyRevenue * (margin / 100);
    const breakEven = monthlyProfit > 0 ? investment / monthlyProfit : 0;
    const annualRevenue = monthlyRevenue * 12;
    const data = Array.from({ length: 12 }, (_, i) => {
      const growth = 1 + i * 0.08; // modest 8% MoM compounding-ish
      return {
        month: `M${i + 1}`,
        revenue: Math.round(monthlyRevenue * growth),
        profit: Math.round(monthlyProfit * growth),
      };
    });
    const annualProfit = data.reduce((s, d) => s + d.profit, 0);
    const roi = investment > 0 ? annualProfit / investment : 0;
    return { monthlyRevenue, monthlyProfit, breakEven, annualRevenue, annualProfit, roi, data };
  }, [investment, aov, orders, margin]);

  return (
    <Section tone="dark" id="roi">
      <SectionHeading
        invert
        eyebrow="ROI Calculator"
        title="See what your store could earn"
        description="Adjust the numbers to model your business. Estimates only — your results depend on products, pricing, and marketing."
      />
      <div ref={ref} className="mx-auto mt-14 max-w-5xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={play ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-950/5 lg:grid-cols-2 sm:p-8"
        >
          {/* Inputs */}
          <div className="flex flex-col justify-center gap-6">
            <Slider label="Startup investment" value={investment} min={500} max={20000} step={500} onChange={setInvestment} format={currency} />
            <Slider label="Average order value" value={aov} min={10} max={250} step={5} onChange={setAov} format={currency} />
            <Slider label="Orders per month" value={orders} min={20} max={2000} step={20} onChange={setOrders} format={(v) => v.toLocaleString()} />
            <Slider label="Profit margin" value={margin} min={10} max={80} step={5} onChange={setMargin} format={(v) => `${v}%`} />
          </div>

          {/* Outputs */}
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-ink-950 p-6 text-white">
            {/* live glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl animate-aurora"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.6), transparent 70%)" }}
            />

            {/* headline projected profit */}
            <div className="relative flex items-end justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-ink-400">
                  <span className="relative flex h-1.5 w-1.5">
                    {!reduce && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                  </span>
                  12-month profit projection
                </p>
                <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-brand-400 tabular-nums sm:text-[2.75rem]">
                  <AnimatedNumber value={result.annualProfit} format={currency} play={play} />
                </p>
              </div>
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-300 tabular-nums">
                <TrendingUp className="h-3.5 w-3.5" />
                <AnimatedNumber value={result.roi} format={(v) => `${v.toFixed(1)}× ROI`} play={play} />
              </span>
            </div>

            <div className="relative grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              {[
                { label: "Monthly revenue", value: result.monthlyRevenue, format: currency, accent: false },
                { label: "Monthly profit", value: result.monthlyProfit, format: currency, accent: true },
                { label: "Break-even", value: result.breakEven, format: (v: number) => `${v.toFixed(1)} mo`, accent: false },
                { label: "Annual revenue", value: result.annualRevenue, format: currency, accent: false },
              ].map((o) => (
                <div key={o.label}>
                  <p className="text-xs text-ink-400">{o.label}</p>
                  <p className={`font-display text-2xl font-extrabold tabular-nums ${o.accent ? "text-brand-400" : "text-white"}`}>
                    <AnimatedNumber value={o.value} format={o.format} play={play} />
                  </p>
                </div>
              ))}
            </div>

            <div className="relative h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roi-rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="roi-profit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v) => currency(Number(v))}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#roi-rev)"
                    isAnimationActive={!reduce}
                    animationDuration={700}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#roi-profit)"
                    isAnimationActive={!reduce}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="relative flex items-center justify-center gap-4 text-[11px] text-ink-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ai-500" /> Profit</span>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
