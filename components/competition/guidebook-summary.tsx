import { Info, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { SkillChip } from "@/components/ui/skill-chip";
import { DRAFT_SUMMARY_NOTE, type GuidebookSummary } from "@/lib/ai/guidebook-summary";
import { ROLE_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

const page = (p: number | null) => (p ? `hal. ${p}` : null);

/**
 * The "Ringkasan guidebook" tab of `/lomba/[slug]` (F-CMP-02, PRD §10.3): summary, judging
 * criteria, suggested roles with their source, and key deadlines. Only rendered for a `draft` or
 * `reviewed` extraction; a `draft` carries the "not checked by an admin" note.
 */
export function GuidebookSummaryTab({ summary: s }: { summary: GuidebookSummary }) {
  return (
    <div className="flex flex-col gap-4">
      <Card padding="lg" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink-strong">Ringkasan</h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles aria-hidden size={14} strokeWidth={1.75} />
            Dibuat AI
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-line text-ink-2">{s.summary}</p>
        {s.isDraft && (
          <p className="flex items-start gap-2 rounded-md bg-warning-50 px-3 py-2 text-[13px] text-warning-ink">
            <Info aria-hidden size={16} strokeWidth={1.75} className="mt-px shrink-0" />
            {DRAFT_SUMMARY_NOTE}.
          </p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <SectionLabel>Kriteria penilaian</SectionLabel>
          {s.criteria.length === 0 ? (
            <p className="text-sm text-ink-2">Guidebook tidak menyebut kriteria penilaian.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {s.criteria.map((c, i) => (
                <li key={i} className="flex items-baseline gap-3 py-2 text-sm first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1 text-ink">{c.name}</span>
                  <span className="font-mono text-ink-strong tabular-nums">
                    {c.weightPercent != null ? `${c.weightPercent}%` : "–"}
                  </span>
                  <span className="w-12 text-right font-mono text-xs text-ink-3 tabular-nums">
                    {page(c.page)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <SectionLabel>Role usulan</SectionLabel>
          <ul className="flex flex-col gap-3">
            {s.roles.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className={cn("w-[3px] shrink-0 rounded-full", ROLE_COLORS[r.colorKey].solid)}
                />
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-strong">{r.name}</span>
                    <span className="text-xs text-ink-3">{r.sourceLabel}</span>
                  </div>
                  {r.skills.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label={`Skill untuk ${r.name}`}>
                      {r.skills.map((sk) => (
                        <li key={sk.name}>
                          <SkillChip name={sk.required ? sk.name : `${sk.name} (opsional)`} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {s.deadlines.length > 0 && (
        <p className="text-sm text-ink-2">
          <span className="font-medium text-ink">Deadline penting: </span>
          {s.deadlines.map((d, i) => (
            <span key={i}>
              {i > 0 && <span aria-hidden> · </span>}
              {d.name} {d.date ? formatDate(d.date, { year: false }) : "(tanggal belum ada)"}
              {d.page && <span className="font-mono text-xs text-ink-3"> ({page(d.page)})</span>}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
