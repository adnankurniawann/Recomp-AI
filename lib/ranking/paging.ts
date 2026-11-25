// Paging for the ranking tab (F-RNK-01). `ranking_candidates` drops anyone with a pending invite
// from this team (PRD §7.2 filter 5), so once the leader invites someone the server's list is one
// shorter. The client keeps invited rows on screen with their new status, so it can't use the
// number of loaded rows as the next offset: that would skip one candidate per invite.
import type { RankingCandidate, RankingPage } from "./types";

export interface LoadedRanking {
  /** The server's count of candidates still in the list. */
  total: number;
  candidates: RankingCandidate[];
}

/** Loaded candidates the server still lists, which is also the offset of the next page. */
export function nextOffset(candidates: readonly RankingCandidate[]): number {
  return candidates.filter((c) => c.inviteStatus !== "pending").length;
}

export function hasMore(r: LoadedRanking): boolean {
  return nextOffset(r.candidates) < r.total;
}

/** Adds the next page, skipping anyone already loaded (the list can shift between requests). */
export function appendPage(r: LoadedRanking, page: RankingPage): LoadedRanking {
  const seen = new Set(r.candidates.map((c) => c.profile.id));
  return {
    total: page.total,
    candidates: [...r.candidates, ...page.candidates.filter((c) => !seen.has(c.profile.id))],
  };
}

/** Marks a loaded candidate as invited; the server's list loses them, so the total drops by one. */
export function markInvited(r: LoadedRanking, profileId: string): LoadedRanking {
  const target = r.candidates.find((c) => c.profile.id === profileId);
  if (!target || target.inviteStatus === "pending") return r;
  return {
    total: Math.max(0, r.total - 1),
    candidates: r.candidates.map((c) =>
      c.profile.id === profileId ? { ...c, inviteStatus: "pending" } : c,
    ),
  };
}
