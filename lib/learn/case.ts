// Small helpers for case-study answers (F-LRN-04).

/** A rubric score as shown: whole numbers plain, halves with a comma ("3", "2,5"). */
export function formatScore(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
