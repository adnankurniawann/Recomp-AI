import { RANKING_PAGE_SIZE, type RankingPage } from "./types";

export class RankingError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** One page of GET /api/ranking/[teamRoleId] (PRD §13.2). Throws RankingError with the API's code. */
export async function fetchRankingPage(teamRoleId: string, offset: number): Promise<RankingPage> {
  const params = new URLSearchParams({ limit: String(RANKING_PAGE_SIZE), offset: String(offset) });
  const res = await fetch(`/api/ranking/${encodeURIComponent(teamRoleId)}?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new RankingError(
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "Ranking belum bisa dimuat.",
    );
  }
  return (await res.json()) as RankingPage;
}
