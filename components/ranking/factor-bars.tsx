import { FACTOR_KEYS, FACTOR_LABELS, factorPoints } from "@/lib/format/score";
import type { FactorKey } from "@/lib/matching/types";

interface FactorBarsProps {
  factors: Record<FactorKey, number>;
  weights: Record<FactorKey, number>;
}

/** The five score factors as bars with "40/40" points (F-RNK-02, PRD §10.5). */
export function FactorBars({ factors, weights }: FactorBarsProps) {
  return (
    <ul className="flex flex-col gap-2">
      {FACTOR_KEYS.map((key) => {
        const p = factorPoints(factors[key], weights[key]);
        const percent = p.max > 0 ? (p.value / p.max) * 100 : 0;
        return (
          <li key={key} className="grid grid-cols-[7.5rem_1fr_3.75rem] items-center gap-3 text-sm">
            <span className="text-ink-2">{FACTOR_LABELS[key]}</span>
            <span
              role="meter"
              aria-label={FACTOR_LABELS[key]}
              aria-valuemin={0}
              aria-valuemax={p.max}
              aria-valuenow={p.value}
              aria-valuetext={p.text}
              className="h-1.5 overflow-hidden rounded-full bg-primary-200"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="text-right font-mono text-[13px] text-ink-strong tabular-nums">
              {p.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
