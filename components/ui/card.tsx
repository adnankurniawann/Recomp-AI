import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "lg";
  interactive?: boolean;
}

/** White, 1 px `line` border, 16 px radius, `shadow-xs`. `interactive` darkens the border on hover; it never lifts. */
export function Card({ padding = "md", interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface shadow-xs",
        padding === "lg" ? "p-6" : "p-4",
        interactive && "transition-colors duration-150 ease-out hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}
