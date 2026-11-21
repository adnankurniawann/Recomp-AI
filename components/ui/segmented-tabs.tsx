"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedTab<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the tab list. */
  label: string;
  /** Id prefix: tab `${idBase}-tab-${value}` controls panel `${idBase}-panel-${value}`. */
  idBase: string;
  className?: string;
}

/**
 * Grey track with the active tab in white (design-system.md). Arrow keys move between tabs, as
 * the WAI-ARIA tabs pattern expects; the panel uses `segmentedPanelProps`.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase,
  className,
}: SegmentedTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    onChange(tabs[next]!.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full gap-0.5 overflow-x-auto rounded-md bg-surface-2 p-[3px]",
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${tab.value}`}
            aria-selected={active}
            aria-controls={`${idBase}-panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none",
              active ? "bg-surface text-primary shadow-xs" : "text-ink-2 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Props for the panel a SegmentedTabs controls. */
export function segmentedPanelProps(idBase: string, value: string) {
  return {
    role: "tabpanel" as const,
    id: `${idBase}-panel-${value}`,
    "aria-labelledby": `${idBase}-tab-${value}`,
  };
}
