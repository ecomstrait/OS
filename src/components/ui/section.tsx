import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "muted" | "dark" | "gradient";
  size?: "md" | "lg";
};

const tones = {
  light: "bg-white text-ink-950",
  muted: "bg-ink-50 text-ink-950",
  dark: "bg-ink-950 text-white",
  gradient:
    "bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950 text-white",
};

export function Section({
  children,
  className,
  id,
  tone = "light",
  size = "lg",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        tones[tone],
        size === "lg" ? "py-20 sm:py-28" : "py-14 sm:py-20",
        "scroll-mt-24",
        className,
      )}
    >
      <div className="container-px">{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  invert?: boolean;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  invert = false,
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center mx-auto max-w-3xl" : "items-start",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-[0.18em]",
            invert ? "text-brand-400" : "text-brand-600",
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl font-bold sm:text-4xl md:text-[2.75rem] md:leading-[1.1]",
          invert ? "text-white" : "text-ink-950",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-lg leading-relaxed",
            invert ? "text-ink-200" : "text-ink-500",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
