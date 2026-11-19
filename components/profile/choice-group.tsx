"use client";

import { cn } from "@/lib/utils";

interface ChoiceGroupProps<T extends string> {
  name: string;
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
}

/** A row of radio boxes for a short enum (tujuan, jam kerja). */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset
      className="flex flex-col gap-1.5"
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className="mb-1.5 text-sm font-medium text-ink-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center rounded-md border border-line bg-surface px-4 text-sm text-ink shadow-xs transition-[border-color,background-color] duration-150 ease-out hover:border-line-strong md:h-10",
              "has-checked:border-primary has-checked:bg-wash has-checked:text-primary-hover",
              "has-focus-visible:ring-3 has-focus-visible:ring-primary-200",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface SwitchFieldProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchField({ id, label, description, checked, onChange }: SwitchFieldProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3"
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors duration-150 ease-out peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-primary-200 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-xs after:transition-transform after:duration-150 peer-checked:after:translate-x-4"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-3">{description}</span>
      </span>
    </label>
  );
}
