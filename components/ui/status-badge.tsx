import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "primary" | "success" | "warning" | "danger" | "neutral";

// Solid colour for the dot, `-ink` shade for the text (PRD §9.2).
const tones: Record<StatusTone, { dot: string; text: string }> = {
  primary: { dot: "bg-primary", text: "text-primary-hover" },
  success: { dot: "bg-success", text: "text-success-ink" },
  warning: { dot: "bg-warning", text: "text-warning-ink" },
  danger: { dot: "bg-danger", text: "text-danger-ink" },
  neutral: { dot: "bg-ink-3", text: "text-ink-2" },
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}

/** A 26 px white outlined pill with a coloured dot, for team, invite and extraction statuses. */
export function StatusBadge({ tone = "neutral", children, className }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs font-medium whitespace-nowrap",
        t.text,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
      {children}
    </span>
  );
}
