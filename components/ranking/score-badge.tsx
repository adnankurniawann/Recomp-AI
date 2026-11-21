"use client";

import { useEffect, useId, useRef, useState } from "react";
import { scoreTone, type ScoreTone } from "@/lib/format/score";
import type { FactorKey } from "@/lib/matching/types";
import { cn } from "@/lib/utils";
import { FactorBars } from "./factor-bars";

const DOTS: Record<ScoreTone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
};

export const ALGORITHM_NOTE = "Skor dihitung algoritma, bukan AI.";

interface ScoreBadgeProps {
  score: number;
  factors: Record<FactorKey, number>;
  weights: Record<FactorKey, number>;
  /** Which side of the badge the popover lines up with. */
  align?: "start" | "end";
  className?: string;
}

/**
 * The 0 to 100 score with a coloured dot (design-system.md). Clicking it opens the score breakdown
 * popover with the five factors (F-RNK-02). Escape or a click outside closes it.
 */
export function ScoreBadge({ score, factors, weights, align = "end", className }: ScoreBadgeProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className={cn("relative inline-flex", className)}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`Skor ${score} dari 100, lihat rincian`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="tap-target inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-line bg-surface px-2 transition-[border-color] duration-150 ease-out hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
      >
        <span aria-hidden className={cn("size-2 rounded-full", DOTS[scoreTone(score)])} />
        <span className="font-mono text-[15px] text-ink-strong tabular-nums">{score}</span>
      </button>
      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`Rincian skor ${score}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-full z-30 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-pop",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <p className="text-sm font-semibold text-ink-strong">
            Rincian skor <span className="font-mono tabular-nums">{score}</span>
          </p>
          <FactorBars factors={factors} weights={weights} />
          <p className="text-xs text-ink-3">{ALGORITHM_NOTE}</p>
        </div>
      )}
    </div>
  );
}
