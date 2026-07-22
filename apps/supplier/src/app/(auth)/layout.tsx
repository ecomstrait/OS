import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-50/60 px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)" }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight text-ink-950">
            EcomStrait <span className="text-brand-600">Suppliers</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-xl shadow-ink-950/5">
          {children}
        </div>
      </div>
    </main>
  );
}
