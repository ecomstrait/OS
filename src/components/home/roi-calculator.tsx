"use client";

import { useMemo, useState } from "react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

function currency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

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
        <span className="text-sm font-bold text-ink-950">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow"
        style={{
          background: `linear-gradient(to right, var(--color-brand-500) ${pct}%, var(--color-ink-100) ${pct}%)`,
        }}
      />
    </div>
  );
}

export function RoiCalculator() {
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
    return { monthlyRevenue, monthlyProfit, breakEven, annualRevenue, data };
  }, [investment, aov, orders, margin]);

  return (
    <Section tone="light" id="roi">
      <SectionHeading
        eyebrow="ROI Calculator"
        title="See what your store could earn"
        description="Adjust the numbers to model your business. Estimates only — your results depend on products, pricing, and marketing."
      />
      <Reveal className="mx-auto mt-14 max-w-5xl">
        <div className="grid gap-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-950/5 lg:grid-cols-2 sm:p-8">
          {/* Inputs */}
          <div className="flex flex-col justify-center gap-6">
            <Slider label="Startup investment" value={investment} min={500} max={20000} step={500} onChange={setInvestment} format={currency} />
            <Slider label="Average order value" value={aov} min={10} max={250} step={5} onChange={setAov} format={currency} />
            <Slider label="Orders per month" value={orders} min={20} max={2000} step={20} onChange={setOrders} format={(v) => v.toLocaleString()} />
            <Slider label="Profit margin" value={margin} min={10} max={80} step={5} onChange={setMargin} format={(v) => `${v}%`} />
          </div>

          {/* Outputs */}
          <div className="flex flex-col gap-5 rounded-2xl bg-ink-950 p-6 text-white">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Monthly revenue", value: currency(result.monthlyRevenue) },
                { label: "Monthly profit", value: currency(result.monthlyProfit), accent: true },
                { label: "Break-even", value: `${result.breakEven.toFixed(1)} mo` },
                { label: "Annual revenue", value: currency(result.annualRevenue) },
              ].map((o) => (
                <div key={o.label}>
                  <p className="text-xs text-ink-400">{o.label}</p>
                  <p className={`text-2xl font-extrabold font-display ${o.accent ? "text-brand-400" : "text-white"}`}>
                    {o.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6a80b0", fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v) => currency(Number(v))}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
