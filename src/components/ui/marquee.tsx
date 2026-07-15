import { cn } from "@/lib/utils";

/** Infinite horizontal marquee. Duplicates children for a seamless loop. */
export function Marquee({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("group relative flex overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="flex shrink-0 animate-[marquee_40s_linear_infinite] items-center group-hover:[animation-play-state:paused]">
        {children}
        {children}
      </div>
    </div>
  );
}
