import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { OceanBackdrop } from "@/components/ui/ocean-backdrop";

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

/** Shared hero for interior pages — dark, on-brand, with a subtle aurora. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40"
      />
      <OceanBackdrop accentHex="#3b82f6" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.55), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />
      <div className="container-px relative py-20 sm:py-28">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          {eyebrow && (
            <Badge tone="light" className="backdrop-blur">
              {eyebrow}
            </Badge>
          )}
          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-lg text-ink-200 sm:text-xl">
              {description}
            </p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
