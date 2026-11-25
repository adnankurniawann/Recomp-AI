import { describe, expect, it } from "vitest";
import { fixtureRanking, fixtureTeam } from "@/lib/fixtures";
import { appendPage, hasMore, markInvited, nextOffset, type LoadedRanking } from "./paging";
import type { RankingCandidate } from "./types";

const base = fixtureRanking(fixtureTeam.roles[1]!.id);
const all: RankingCandidate[] = ["a", "b", "c", "d"].map((id) => ({
  ...base.candidates[0]!,
  profile: { ...base.candidates[0]!.profile, id },
}));
const page = (candidates: RankingCandidate[], total: number) => ({
  role: base.role,
  total,
  candidates,
});

describe("ranking paging", () => {
  it("starts the next page after the loaded candidates", () => {
    const r: LoadedRanking = { total: all.length, candidates: all.slice(0, 2) };
    expect(nextOffset(r.candidates)).toBe(2);
    expect(hasMore(r)).toBe(true);
    expect(hasMore({ total: 2, candidates: all.slice(0, 2) })).toBe(false);
  });

  it("does not skip a candidate after an invite", () => {
    // Server list: a b c d. The leader loads a b, then invites a.
    const loaded = markInvited({ total: 4, candidates: all.slice(0, 2) }, all[0]!.profile.id);
    expect(loaded.total).toBe(3);
    expect(loaded.candidates[0]!.inviteStatus).toBe("pending");

    // The server now lists b c d, so the next page starts at offset 1 and begins with c.
    const offset = nextOffset(loaded.candidates);
    expect(offset).toBe(1);
    const serverList = all.slice(1, 4);
    const next = appendPage(loaded, page(serverList.slice(offset, offset + 2), 3));
    expect(next.candidates.map((c) => c.profile.id)).toEqual(
      all.slice(0, 4).map((c) => c.profile.id),
    );
    expect(hasMore(next)).toBe(false);
  });

  it("ignores a second invite and unknown candidates", () => {
    const once = markInvited({ total: 4, candidates: all.slice(0, 2) }, all[0]!.profile.id);
    expect(markInvited(once, all[0]!.profile.id)).toBe(once);
    expect(markInvited(once, "not-loaded")).toBe(once);
  });

  it("skips candidates already loaded when the list shifts", () => {
    const r: LoadedRanking = { total: 4, candidates: all.slice(0, 2) };
    const next = appendPage(r, page(all.slice(1, 3), 4));
    expect(next.candidates.map((c) => c.profile.id)).toEqual(
      all.slice(0, 3).map((c) => c.profile.id),
    );
  });
});
