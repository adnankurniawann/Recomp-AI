import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: ReactNode;
  /** Required: an icon-only button needs an accessible name. */
  label: string;
}

/** A 40 px outlined square holding one icon (PRD §9.7). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-2 shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out hover:border-line-strong hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none active:bg-surface-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
});
