import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  /** Visible text above the bar, also used as its accessible name. */
  label?: string;
  className?: string;
}

/** A 6 px pill bar: `primary` fill on a `primary-200` track (PRD §9.7). */
export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-sm text-ink-2">{label}</span>}
      <div
        role="progressbar"
        aria-label={label ?? "Progres"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        className="h-1.5 w-full overflow-hidden rounded-full bg-primary-200"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
