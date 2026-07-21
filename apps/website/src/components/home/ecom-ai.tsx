"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles, ArrowUp, Check, Loader2, RefreshCw } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { aiFeatures } from "@/content/ai";

const buildSteps = [
  "Designing your brand & logo",
  "Building homepage & layout",
  "Generating product pages",
  "Writing SEO & descriptions",
  "Optimizing for mobile",
];

const presets = [
  "A modern cosmetics store",
  "A minimalist furniture shop",
  "A vibrant sports gear store",
];

type Phase = "idle" | "building" | "done";

export function EcomAi() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);

  function generate(text: string) {
    if (!text.trim()) return;
    setPrompt(text);
    setPhase("building");
    setActiveStep(0);
    buildSteps.forEach((_, i) => {
      setTimeout(() => setActiveStep(i + 1), (i + 1) * 700);
    });
    setTimeout(() => setPhase("done"), (buildSteps.length + 1) * 700);
  }

  function reset() {
    setPhase("idle");
    setPrompt("");
    setActiveStep(0);
  }

  return (
    <Section tone="gradient" id="ecom-ai">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* Copy + features */}
        <div>
          <SectionHeading
            align="left"
            invert
            eyebrow="Meet EcomAI"
            title="Your AI business consultant, built into the platform"
            description="From building your website to forecasting sales, EcomAI handles the technical and creative work so you can focus on growing."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {aiFeatures.filter((f) => f.status === "live").slice(0, 6).map((f, i) => (
              <Reveal key={f.title} delay={i * 0.5}>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-400">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-300">{f.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Interactive demo */}
        <Reveal>
          <div className="relative rounded-3xl border border-white/10 bg-ink-900/60 p-5 shadow-2xl backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ai-500 text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">EcomAI Website Builder</p>
                <p className="text-[11px] text-ink-400">Describe your store — watch it come to life</p>
              </div>
            </div>

            {/* Prompt input */}
            <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder="Build me a modern cosmetics store…"
                  className="min-h-[48px] flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-ink-500"
                />
                <button
                  onClick={() => generate(prompt || presets[0])}
                  disabled={phase === "building"}
                  aria-label="Generate store"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {phase === "building" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => generate(p)}
                    disabled={phase === "building"}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-ink-300 transition hover:border-brand-500/40 hover:text-white disabled:opacity-50"
                  >
                    <Sparkles className="mr-1 inline h-3 w-3 text-brand-400" />
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="mt-4 min-h-[220px]">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid h-[220px] place-items-center rounded-2xl border border-dashed border-white/10 text-center"
                  >
                    <p className="max-w-[220px] text-sm text-ink-400">
                      Your generated store preview will appear here.
                    </p>
                  </motion.div>
                )}

                {phase === "building" && (
                  <motion.div
                    key="building"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2.5 rounded-2xl border border-white/10 bg-ink-950/50 p-5"
                  >
                    {buildSteps.map((step, i) => (
                      <div key={step} className="flex items-center gap-3 text-sm">
                        {i < activeStep ? (
                          <Check className="h-4 w-4 text-brand-400" />
                        ) : i === activeStep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-ai-400" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-white/20" />
                        )}
                        <span className={i <= activeStep ? "text-white" : "text-ink-500"}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {phase === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-2">
                      <span className="text-[11px] font-medium text-ink-500">yourstore.com</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600">
                        <Check className="h-3 w-3" /> Ready to deploy
                      </span>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="h-20 rounded-xl bg-gradient-to-r from-brand-100 via-ai-100 to-brand-50" />
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="aspect-square rounded-lg bg-ink-100" />
                            <div className="h-2 w-3/4 rounded bg-ink-100" />
                            <div className="h-2 w-1/2 rounded bg-brand-200" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                      <span className="text-xs text-ink-500">Generated in seconds ✨</span>
                      <button
                        onClick={reset}
                        className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800"
                      >
                        <RefreshCw className="h-3 w-3" /> Try another
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
