import type { RankingCandidate } from "./types";

export const RANKING_SORTS = ["score", "availability", "experience"] as const;
export type RankingSort = (typeof RANKING_SORTS)[number];

export const RANKING_SORT_LABELS: Record<RankingSort, string> = {
  score: "Skor",
  availability: "Ketersediaan",
  experience: "Pengalaman",
};

/**
 * Re-order the loaded candidates. "score" keeps the API order, which already breaks ties by
 * evidence and freshness (PRD §7.3); the others sort by that factor, then by score.
 */
export function sortCandidates(list: RankingCandidate[], sort: RankingSort): RankingCandidate[] {
  if (sort === "score") return list;
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.factors[sort] - a.c.factors[sort] || b.c.score - a.c.score || a.i - b.i)
    .map(({ c }) => c);
}
