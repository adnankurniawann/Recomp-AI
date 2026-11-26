import { COMP_CATEGORIES, type CompCategory } from "@/lib/constants";

/** What a competition card needs, read from `competitions` plus counts. */
export interface CompetitionSummary {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  category: CompCategory;
  registrationDeadline: string | null; // ISO date, "2026-12-01"
  teamMin: number;
  teamMax: number;
  posterUrl: string | null;
  hasGuidebook: boolean;
  interestCount: number;
  isSimulated: boolean;
  isFeatured: boolean;
}

export const DEADLINE_FILTERS = ["open", "closing", "closed"] as const;
export type DeadlineStatus = (typeof DEADLINE_FILTERS)[number];
export const DEADLINE_LABELS: Record<DeadlineStatus, string> = {
  open: "Dibuka",
  closing: "Segera tutup",
  closed: "Sudah tutup",
};
export const CLOSING_SOON_DAYS = 7;
export const TEAM_SIZES = [1, 2, 3, 4, 5] as const;

export interface CompetitionFilters {
  category?: CompCategory;
  deadline?: DeadlineStatus;
  teamSize?: number;
  q?: string;
}

/** Whole days from `today` to `deadline`; both are ISO dates. */
export function daysLeft(deadline: string, today: string): number {
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86_400_000);
}

/** A competition with no deadline counts as open. "Closing" is also open. */
export function deadlineStatus(deadline: string | null, today: string): DeadlineStatus {
  if (!deadline) return "open";
  const days = daysLeft(deadline, today);
  if (days < 0) return "closed";
  return days <= CLOSING_SOON_DAYS ? "closing" : "open";
}

/** Reads filters from the URL; unknown values are dropped. */
export function parseFilters(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const category = one("kategori");
  const deadline = one("deadline");
  const teamSize = Number(one("tim"));
  return {
    category: COMP_CATEGORIES.find((c) => c === category),
    deadline: DEADLINE_FILTERS.find((d) => d === deadline),
    teamSize: (TEAM_SIZES as readonly number[]).includes(teamSize) ? teamSize : undefined,
    q: one("q")?.trim() || undefined,
  } satisfies CompetitionFilters;
}

/**
 * Filters, then sorts: featured competitions first (F-CMP-05), then open competitions by nearest deadline, then those without a deadline,
 * then closed ones, most recently closed first.
 */
export function filterCompetitions(
  list: CompetitionSummary[],
  filters: CompetitionFilters,
  today: string,
): CompetitionSummary[] {
  const q = filters.q?.toLowerCase();
  const result = list.filter((c) => {
    const status = deadlineStatus(c.registrationDeadline, today);
    if (filters.category && c.category !== filters.category) return false;
    // "Dibuka" includes the ones closing soon.
    if (filters.deadline === "open" && status === "closed") return false;
    if (filters.deadline && filters.deadline !== "open" && status !== filters.deadline)
      return false;
    if (filters.teamSize && (filters.teamSize < c.teamMin || filters.teamSize > c.teamMax))
      return false;
    if (q && !`${c.name} ${c.organizer}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const rank = (c: CompetitionSummary): [number, number] => {
    if (!c.registrationDeadline) return [1, 0];
    const days = daysLeft(c.registrationDeadline, today);
    return days < 0 ? [2, -days] : [0, days];
  };
  return result.sort((a, b) => {
    const [ga, da] = rank(a);
    const [gb, db] = rank(b);
    return Number(b.isFeatured) - Number(a.isFeatured) || ga - gb || da - db;
  });
}
