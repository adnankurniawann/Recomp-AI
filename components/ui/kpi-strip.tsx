import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  /** The big number, such as "2/4". */
  value: ReactNode;
  /** A short line under the number, such as "1 menunggu". */
  sub?: ReactNode;
  /**
   * The 6 px bar under the number. `segments` draws one piece per unit ("2 of 4 roles"), otherwise
   * it is one continuous bar ("27 of 41 candidates").
   */
  bar?: { value: number; max: number; segments?: boolean };
}

/** One card split into up to four columns of numbers (PRD §9.7, the team dashboard in §10.4). */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface shadow-xs lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col gap-1.5 border-line p-4",
            i % 2 === 1 && "border-l",
            i >= 2 && "border-t lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <dt className="text-[13px] text-ink-2">{item.label}</dt>
          <dd className="font-mono text-2xl leading-tight text-ink-strong tabular-nums">
            {item.value}
          </dd>
          {item.sub && <dd className="text-xs text-ink-2">{item.sub}</dd>}
          {item.bar && <KpiBar {...item.bar} label={item.label} />}
        </div>
      ))}
    </dl>
  );
}

function KpiBar({ value, max, segments, label }: NonNullable<KpiItem["bar"]> & { label: string }) {
  const safeMax = Math.max(max, 0);
  const filled = Math.min(Math.max(value, 0), safeMax);
  const meter = {
    role: "meter" as const,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": safeMax,
    "aria-valuenow": filled,
  };

  if (segments && safeMax > 0 && safeMax <= 12) {
    return (
      <dd {...meter} className="mt-1 flex gap-1">
        {Array.from({ length: safeMax }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < filled ? "bg-primary" : "bg-primary-200",
            )}
          />
        ))}
      </dd>
    );
  }
  return (
    <dd {...meter} className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary-200">
      <span
        className="block h-full rounded-full bg-primary"
        style={{ width: `${safeMax ? (filled / safeMax) * 100 : 0}%` }}
      />
    </dd>
  );
}
