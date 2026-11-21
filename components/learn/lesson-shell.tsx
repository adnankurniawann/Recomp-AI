"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LessonShellProps {
  /** 64 px bar: logo, breadcrumb, progress, points, guide, menu. */
  top: ReactNode;
  /** Notes and the lesson content. */
  left: ReactNode;
  /** The questions. */
  right: ReactNode;
  /** 56 px primary bar with the previous and next lesson. */
  bottom: ReactNode;
  /** The count shown on the "Soal" tab on phones. */
  questionCount?: number;
}

/**
 * The full-screen lesson frame (PRD §10.7): fixed top and bottom bars, two halves that each scroll
 * on their own. Below 1024 px the halves stack behind "Materi" and "Soal" tabs.
 */
export function LessonShell({ top, left, right, bottom, questionCount }: LessonShellProps) {
  const [tab, setTab] = useState<"materi" | "soal">("materi");
  const tabs = [
    { key: "materi" as const, label: "Materi" },
    { key: "soal" as const, label: "Soal", count: questionCount },
  ];

  return (
    <div className="flex h-dvh flex-col bg-bg">
      {top}

      <div
        role="tablist"
        aria-label="Bagian materi"
        className="flex shrink-0 border-b border-line bg-surface lg:hidden"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 border-b-2 text-sm font-medium transition-colors duration-150 ease-out focus-visible:bg-surface-2 focus-visible:outline-none",
                active ? "border-primary text-ink-strong" : "border-transparent text-ink-2",
              )}
            >
              {t.label}
              {t.count ? (
                <span className="font-mono text-xs text-ink-2 tabular-nums">{t.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2 lg:divide-x lg:divide-line">
        <section
          id="panel-materi"
          aria-labelledby="tab-materi"
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain p-4 lg:block lg:p-6",
            tab === "materi" ? "block" : "hidden",
          )}
        >
          {left}
        </section>
        <section
          id="panel-soal"
          aria-labelledby="tab-soal"
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain p-4 lg:block lg:p-6",
            tab === "soal" ? "block" : "hidden",
          )}
        >
          {right}
        </section>
      </div>

      {bottom}
    </div>
  );
}
