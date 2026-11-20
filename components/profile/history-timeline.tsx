import { Link2 } from "lucide-react";
import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { COMP_CATEGORY_LABELS, COMP_RESULT_LABELS, type CompResult } from "@/lib/constants";
import type { PublicHistoryItem } from "@/lib/profile/public";

const RESULT_TONES: Record<CompResult, StatusTone> = {
  winner_1: "success",
  winner_2: "success",
  winner_3: "success",
  finalist: "primary",
  honorable: "primary",
  participant: "neutral",
};

interface HistoryTimelineProps {
  items: PublicHistoryItem[];
  /** Show only the newest n, with a "Lihat semua" link to `moreHref` (the profile sheet uses 5). */
  limit?: number;
  moreHref?: string;
}

/** Competition history, newest first: dots on a vertical line with a result badge (PRD §10.6). */
export function HistoryTimeline({ items, limit, moreHref }: HistoryTimelineProps) {
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="flex flex-col gap-3">
      <ol className="relative flex flex-col">
        {shown.map((h, index) => (
          <li key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < shown.length - 1 && (
              <span aria-hidden className="absolute top-3 bottom-0 left-[5px] w-px bg-line" />
            )}
            <span
              aria-hidden
              className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-surface bg-primary ring-1 ring-line"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-sm text-ink-3 tabular-nums">{h.year}</span>
                <span className="font-medium text-ink-strong">{h.competitionName}</span>
                <StatusBadge tone={RESULT_TONES[h.result]}>
                  {COMP_RESULT_LABELS[h.result]}
                </StatusBadge>
                {h.evidenceUrl && (
                  <a
                    href={h.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Bukti ${h.competitionName}`}
                    className="inline-flex size-7 items-center justify-center rounded-sm text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
                  >
                    <Link2 aria-hidden size={14} strokeWidth={1.75} />
                  </a>
                )}
              </div>
              <p className="text-sm text-ink-2">
                {COMP_CATEGORY_LABELS[h.category]}
                {h.role && <> · {h.role}</>}
              </p>
              {h.note && <p className="text-sm text-ink-3">{h.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      {limit && items.length > limit && moreHref && (
        <Link
          href={moreHref}
          className="self-start text-sm font-medium text-primary hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
        >
          Lihat semua (<span className="font-mono tabular-nums">{items.length}</span>)
        </Link>
      )}
    </div>
  );
}
