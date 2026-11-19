import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  /** Step titles, in order. */
  steps: readonly string[];
  /** The active step, starting at 1. Steps before it show as done. */
  current: number;
  className?: string;
}

/** Numbered steps for the onboarding and team wizards (PRD §9.7, §10.11). */
export function Stepper({ steps, current, className }: StepperProps) {
  const active = steps[current - 1];

  return (
    <nav aria-label="Langkah" className={className}>
      <ol className="flex items-center gap-2">
        {steps.map((title, index) => {
          const number = index + 1;
          const state = number < current ? "done" : number === current ? "active" : "upcoming";
          return (
            <li
              key={title}
              aria-current={state === "active" ? "step" : undefined}
              className={cn("flex items-center gap-2", index < steps.length - 1 && "flex-1")}
            >
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs tabular-nums",
                  state === "active" && "bg-primary text-white shadow-primary",
                  state === "done" && "bg-wash text-primary-hover",
                  state === "upcoming" && "border border-line bg-surface text-ink-3",
                )}
              >
                {state === "done" ? <Check aria-hidden size={14} strokeWidth={2} /> : number}
              </span>
              <span
                className={cn(
                  "hidden text-sm whitespace-nowrap md:inline",
                  state === "active" ? "font-medium text-ink-strong" : "text-ink-3",
                )}
              >
                {title}
                {state === "done" && <span className="sr-only"> (selesai)</span>}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn("h-px min-w-4 flex-1", state === "done" ? "bg-primary" : "bg-line")}
                />
              )}
            </li>
          );
        })}
      </ol>
      {active && (
        <p className="mt-3 text-sm text-ink-2 md:hidden">
          <span className="font-mono tabular-nums">
            {current}/{steps.length}
          </span>{" "}
          · <span className="font-medium text-ink-strong">{active}</span>
        </p>
      )}
    </nav>
  );
}
