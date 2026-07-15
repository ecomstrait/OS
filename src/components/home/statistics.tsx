import { Reveal } from "@/components/ui/reveal";
import { StatCounter } from "@/components/shared/stat-counter";
import { platformStats } from "@/content/stats";

export function Statistics() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)" }}
      />
      <div className="container-px relative">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">
            By the numbers
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            A platform businesses grow on
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {platformStats.map((stat) => (
            <StatCounter key={stat.label} stat={stat} invert />
          ))}
        </div>
      </div>
    </section>
  );
}
