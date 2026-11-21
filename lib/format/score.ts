import type { FactorKey } from "@/lib/matching/types";

/** The five factors in the order of PRD §7.3, with the labels of the score popover (§10.5). */
export const FACTOR_LABELS: Record<FactorKey, string> = {
  coverage: "Penutupan role",
  level: "Level skill",
  availability: "Ketersediaan",
  experience: "Pengalaman",
  fit: "Minat dan gaya",
};

export const FACTOR_KEYS = Object.keys(FACTOR_LABELS) as FactorKey[];

const points = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/**
 * A factor as points out of its weight: factor 1 with weight 0.4 is "40/40", factor 0.925 with
 * weight 0.2 is "18,5/20". `value` and `max` are the raw numbers, for the bar.
 */
export function factorPoints(factor: number, weight: number) {
  const max = Math.round(weight * 1000) / 10;
  const value = Math.round(Math.min(Math.max(factor, 0), 1) * weight * 1000) / 10;
  return { value, max, text: `${points.format(value)}/${points.format(max)}` };
}

export type ScoreTone = "success" | "primary" | "warning";

/** Dot colour of the ScoreBadge: 80 and up green, 60 to 79 blue, below 60 amber (design-system.md). */
export function scoreTone(score: number): ScoreTone {
  if (score >= 80) return "success";
  if (score >= 60) return "primary";
  return "warning";
}
