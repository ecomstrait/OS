import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/40",
        secondary:
          "bg-ink-950 text-white shadow-lg shadow-ink-950/20 hover:bg-ink-800",
        ai: "bg-ai-500 text-white shadow-lg shadow-ai-500/25 hover:bg-ai-600",
        outline:
          "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50",
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-950",
        "outline-light":
          "border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps & {
  href: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className">;

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if ("href" in props && props.href !== undefined) {
    const { href, variant, size, className, children, ...rest } =
      props as ButtonAsLink;
    return (
      <Link
        href={href}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const { variant, size, className, children, ...rest } =
    props as ButtonAsButton;
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
