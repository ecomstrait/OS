"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, Play, Search, Sparkles, TrendingUp, Bot, Package, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { heroStats } from "@/content/stats";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Backgrounds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[560px] w-[560px] rounded-full opacity-50 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.35), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-20 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent 65%)" }}
      />

      <div className="container-px relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-ink-600 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              AI-Powered Commerce Operating System
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl font-bold leading-[1.06] tracking-tight text-ink-950 sm:text-5xl lg:text-[3.5rem]"
          >
            Launch your online business{" "}
            <span className="text-gradient">without inventory</span> or technical
            expertise.
          </motion.h1>

          <motion.p variants={item} className="max-w-xl text-lg leading-relaxed text-ink-500">
            Connect with verified suppliers, build your ecommerce store with AI,
            and manage everything from one intelligent platform — then start
            selling with confidence.
          </motion.p>

          <motion.div variants={item} className="flex flex-col flex-wrap gap-3 sm:flex-row">
            <Button href="/store-owners" variant="primary" size="lg">
              Launch My Store <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/suppliers" variant="ai" size="lg">
              <Search className="h-4 w-4" /> Find Supplier
            </Button>
            <Button href="/suppliers" variant="secondary" size="lg">
              Become a Supplier
            </Button>
            <Button href="/how-it-works" variant="ghost" size="lg">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </motion.div>

          <motion.dl variants={item} className="mt-4 grid grid-cols-3 gap-6 border-t border-ink-100 pt-6">
            {heroStats.map((s) => (
              <div key={s.label}>
                <dt className="text-2xl font-extrabold text-ink-950 font-display">
                  {s.prefix}{s.value}{s.suffix}
                </dt>
                <dd className="mt-1 text-xs leading-tight text-ink-500">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Visual */}
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 }}
      className="relative mx-auto w-full max-w-lg"
    >
      {/* Dashboard window */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl shadow-ink-950/10">
        <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
          <span className="ml-3 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-ink-400">
            lumiere-beauty.store
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-400">Revenue this month</p>
              <p className="text-2xl font-extrabold text-ink-950 font-display">$42,580</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
              <TrendingUp className="h-3.5 w-3.5" /> +28%
            </span>
          </div>
          {/* Mini chart */}
          <div className="flex h-24 items-end gap-1.5">
            {[40, 55, 45, 70, 60, 85, 75, 95, 88, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.05, ease: "easeOut" }}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-500/70 to-ai-500/70"
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", value: "1,284" },
              { label: "Products", value: "342" },
              { label: "Visitors", value: "28.4k" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-ink-50 p-3">
                <p className="text-sm font-bold text-ink-950">{c.value}</p>
                <p className="text-[10px] text-ink-400">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating: AI chat */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-6 top-24 hidden w-52 rounded-xl border border-ink-100 bg-white p-3 shadow-xl shadow-ink-950/10 sm:block"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai-500 text-white">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold text-ink-950">EcomAI</span>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-500">
          Your best-selling product is up 34%. Want me to restock and adjust pricing?
        </p>
      </motion.div>

      {/* Floating: order notification */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-4 top-8 hidden items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 shadow-xl shadow-ink-950/10 sm:flex"
      >
        <CheckCircle2 className="h-5 w-5 text-brand-500" />
        <div>
          <p className="text-[11px] font-semibold text-ink-950">New order · $128</p>
          <p className="text-[10px] text-ink-400">Routed to supplier ✓</p>
        </div>
      </motion.div>

      {/* Floating: supplier card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-6 -right-2 hidden items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 shadow-xl shadow-ink-950/10 sm:flex"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Package className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-ink-950">Verified Supplier</p>
          <p className="text-[10px] text-ink-400">1,240 products in sync</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
