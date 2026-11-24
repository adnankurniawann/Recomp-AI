import { z } from "zod";

// The trial metrics of PRD §17 from `trial_metrics()` (migration 0015), turned into rows for
// /admin/metrik. Pure, so the numbers are unit tested.

const count = z.coerce.number();

const Side = z.object({
  participants: count,
  teams: count,
  minutes_to_ranking: z.array(z.coerce.number()),
  feedback: z.object({ fit: count, not_fit: count }),
  invites: z.object({ accepted: count, declined: count, expired: count, pending: count }),
  intervention: z.object({ changed: count, suggested: count }),
  drafts: z.object({ sent: count, total: count }),
});
export const TrialMetrics = z.object({ real: Side, simulated: Side });
export type TrialMetrics = z.infer<typeof TrialMetrics>;
type SideData = z.infer<typeof Side>;

export interface MetricCell {
  /** The headline: "75%", "12 menit", or "–" without data. */
  value: string;
  /** How it was counted: "3 dari 4". */
  detail: string;
}

export interface MetricRow {
  key: string;
  label: string;
  formula: string;
  real: MetricCell;
  simulated: MetricCell;
}

const EMPTY: MetricCell = { value: "–", detail: "Belum ada data" };

export function percent(part: number, whole: number): MetricCell {
  if (whole <= 0) return EMPTY;
  const value = Math.round((part / whole) * 100);
  return { value: `${value}%`, detail: `${part} dari ${whole}` };
}

export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} menit`;
  const hours = minutes / 60;
  if (hours < 48) return `${(Math.round(hours * 10) / 10).toLocaleString("id-ID")} jam`;
  return `${Math.round(hours / 24)} hari`;
}

function timeToRanking(side: SideData): MetricCell {
  const m = median(side.minutes_to_ranking);
  if (m === null) return EMPTY;
  return { value: formatMinutes(m), detail: `median dari ${side.minutes_to_ranking.length} tim` };
}

export function metricRows(data: TrialMetrics): MetricRow[] {
  const rows: Omit<MetricRow, "real" | "simulated">[] = [
    {
      key: "time",
      label: "Waktu sampai daftar kandidat",
      formula: "Ranking pertama dibuka dikurangi waktu tim dibuat",
    },
    { key: "fit", label: "Rekomendasi dinilai cocok", formula: "Cocok / (Cocok + Kurang cocok)" },
    {
      key: "accept",
      label: "Tingkat terima undangan",
      formula: "Diterima / (diterima + ditolak + kedaluwarsa)",
    },
    {
      key: "intervention",
      label: "Campur tangan ketua",
      formula: "Role usulan yang diubah atau dihapus / role usulan",
    },
    { key: "drafts", label: "Draf agent yang dikirim", formula: "Draf terkirim / semua draf" },
  ];
  const cell = (key: string, side: SideData): MetricCell => {
    switch (key) {
      case "time":
        return timeToRanking(side);
      case "fit":
        return percent(side.feedback.fit, side.feedback.fit + side.feedback.not_fit);
      case "accept": {
        const i = side.invites;
        return percent(i.accepted, i.accepted + i.declined + i.expired);
      }
      case "intervention":
        return percent(side.intervention.changed, side.intervention.suggested);
      default:
        return percent(side.drafts.sent, side.drafts.total);
    }
  };
  return rows.map((r) => ({
    ...r,
    real: cell(r.key, data.real),
    simulated: cell(r.key, data.simulated),
  }));
}
