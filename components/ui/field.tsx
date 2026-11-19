import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  /** The id of the control inside, so the label and messages point at it. */
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A label, the control, then a hint or an error. Give the control `id`, `aria-invalid={!!error}` and
 * `aria-describedby={fieldDescribedBy(id, hint, error)}`.
 */
export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
        {optional && <span className="font-normal text-ink-3"> (opsional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescribedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
