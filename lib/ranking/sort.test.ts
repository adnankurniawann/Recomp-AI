import { describe, expect, it } from "vitest";
import { fixtureRanking, fixtureTeam } from "@/lib/fixtures";
import { sortCandidates } from "./sort";

const list = fixtureRanking(fixtureTeam.roles[1]!.id).candidates;

describe("sortCandidates", () => {
  it("keeps the API order for score", () => {
    expect(sortCandidates(list, "score")).toBe(list);
  });

  it("sorts by a factor, then by score, without changing the input", () => {
    const before = list.map((c) => c.profile.id);
    const sorted = sortCandidates(list, "availability");
    for (let i = 1; i < sorted.length; i++) {
      const [a, b] = [sorted[i - 1]!, sorted[i]!];
      expect(a.factors.availability >= b.factors.availability).toBe(true);
      if (a.factors.availability === b.factors.availability) {
        expect(a.score >= b.score).toBe(true);
      }
    }
    expect(list.map((c) => c.profile.id)).toEqual(before);
  });
});
