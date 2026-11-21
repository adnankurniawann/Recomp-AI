import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  // `active:` gives press feedback with colour only; PRD §9.4 allows no movement.
  primary: "bg-primary text-white shadow-primary hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "border border-line bg-surface text-ink shadow-xs hover:border-line-strong active:bg-surface-2",
  accent:
    "border border-line bg-surface text-primary shadow-xs hover:border-line-strong active:bg-wash",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink active:bg-line",
  danger:
    "border border-line bg-surface text-danger-ink shadow-xs hover:border-danger active:bg-danger-50",
};

const sizes: Record<Size, string> = {
  sm: "tap-target h-8 rounded-sm px-3 text-[13px]",
  // 44 px on phones, 40 px from md up, like Input and Select.
  md: "h-11 rounded-md px-4 text-sm md:h-10",
  lg: "h-11 rounded-md px-5 text-sm",
};

/** The Button classes, for `<Link className={buttonClasses("primary")}>`. */
export function buttonClasses(
  variant: Variant = "secondary",
  size: Size = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

/** PRD §9.7. At most one `primary` per page. For a link that looks like a button, use `buttonClasses`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </button>
  );
});
