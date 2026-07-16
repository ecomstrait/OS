"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

type CtaBannerProps = {
  title?: string;
  description?: string;
};

// Deterministic particle field (avoids hydration mismatch from Math.random).
const PARTICLES = [
  { left: "8%", top: "24%", size: 5, delay: 0, duration: 7, drift: -14 },
  { left: "18%", top: "68%", size: 3, delay: 1.2, duration: 9, drift: 10 },
  { left: "27%", top: "38%", size: 4, delay: 0.6, duration: 8, drift: -8 },
  { left: "38%", top: "78%", size: 6, delay: 2.1, duration: 10, drift: 16 },
  { left: "46%", top: "18%", size: 3, delay: 1.6, duration: 7.5, drift: -12 },
  { left: "55%", top: "62%", size: 5, delay: 0.4, duration: 9.5, drift: 12 },
  { left: "63%", top: "30%", size: 4, delay: 2.6, duration: 8.5, drift: -10 },
  { left: "72%", top: "72%", size: 3, delay: 1.1, duration: 7, drift: 14 },
  { left: "81%", top: "26%", size: 5, delay: 0.9, duration: 10, drift: -16 },
  { left: "90%", top: "58%", size: 4, delay: 2.3, duration: 8, drift: 8 },
];

function LiveCounter({ inView, reduce }: { inView: boolean; reduce: boolean }) {
  const target = 1284;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const t = setTimeout(() => setN(target), 0);
      return () => clearTimeout(t);
    }
    const controls = animate(0, target, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce]);

  return <span>{n.toLocaleString()}</span>;
}

export function CtaBanner({
  title = "Ready to build your business?",
  description = "Whether you're a supplier looking to reach more customers or an entrepreneur ready to launch your online store, EcomStrait gives you the tools, AI, and support to succeed.",
}: CtaBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <section className="bg-white py-20 sm:py-28">
      <div ref={ref} className="container-px">
        <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 py-16 text-center sm:px-16 sm:py-24">
          <style>{`@keyframes cta-shimmer { to { background-position: 200% center; } }`}</style>

          {/* Faint grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20"
          />

          {/* Aurora glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-aurora"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.5), rgba(59,130,246,0.35), transparent 70%)",
            }}
          />

          {/* Second drifting glow */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-1/3 right-0 h-[380px] w-[380px] rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)",
              }}
              animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Floating particles */}
          {!reduce && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-white/70"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    boxShadow: "0 0 8px rgba(255,255,255,0.6)",
                  }}
                  animate={{
                    y: [0, p.drift, 0],
                    opacity: [0, 0.9, 0],
                    scale: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="text-3xl font-bold sm:text-5xl">
              {reduce ? (
                <span className="text-white">{title}</span>
              ) : (
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(100deg, #ffffff 25%, #6ee7b7 45%, #93c5fd 55%, #ffffff 75%)",
                    backgroundSize: "200% auto",
                    animation: "cta-shimmer 5s linear infinite",
                  }}
                >
                  {title}
                </span>
              )}
            </h2>
            <p className="text-lg text-ink-200">{description}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button href="/store-owners" variant="primary" size="lg">
                Launch My Store <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/suppliers" variant="outline-light" size="lg">
                Become a Supplier
              </Button>
            </div>

            {/* Live launch counter */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-2 text-sm text-ink-300"
            >
              <span className="relative flex h-2 w-2">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              <span className="font-semibold text-white">
                <LiveCounter inView={inView} reduce={!!reduce} />
              </span>{" "}
              businesses launching this week
            </motion.p>

            <p className="text-sm text-ink-400">
              Prefer to talk first?{" "}
              <a href="/contact" className="font-medium text-brand-400 hover:underline">
                Book a live demo →
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
