import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "brand" | "ai" | "ink" | "light";
  icon?: React.ReactNode;
};

const tones = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  ai: "bg-ai-50 text-ai-700 border-ai-200",
  ink: "bg-ink-100 text-ink-700 border-ink-200",
  light: "bg-white/10 text-white border-white/15",
};

export function Badge({ children, className, tone = "brand", icon }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
