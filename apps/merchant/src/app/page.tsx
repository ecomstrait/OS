import Link from "next/link";
import { cn } from "@ecomstrait/ui";

const steps = [
  "Describe your business idea",
  "EcomAI finds products & builds your store",
  "Review, then go live on Shopify or your own domain",
];

export default function Home() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.45), rgba(59,130,246,0.3), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-300">
          EcomStrait · Your AI ecommerce co-founder
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Build your online business.{" "}
          <span className="text-gradient">AI handles everything.</span>
        </h1>
        <p className="mt-4 text-lg text-ink-200">
          Describe what you want to sell. EcomAI finds suppliers, builds your store, and helps you launch.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Log in
          </Link>
        </div>

        <ul className="mx-auto mt-10 grid max-w-md gap-2 text-left">
          {steps.map((s, i) => (
            <li
              key={s}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm",
                i === 0 ? "text-white" : "text-ink-300",
              )}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
