import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-primary hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink shadow-xs hover:border-line-strong",
  accent: "border border-line bg-surface text-primary shadow-xs hover:border-line-strong",
  ghost: "text-ink-2 hover:bg-surface-2",
  danger: "border border-line bg-surface text-danger-ink shadow-xs hover:border-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-sm px-3 text-[13px]",
  md: "h-10 rounded-md px-4 text-sm",
  lg: "h-11 rounded-md px-5 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

/** Minimal Button from the design-system recipe. Issue #4 owns the full version. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
});
