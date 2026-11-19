import { describe, expect, it } from "vitest";
import { fixtureProfiles, fixtureRanking, fixtureTeam } from ".";

describe("fixtures", () => {
  const [backend, uiux, product] = fixtureTeam.roles.map((r) => fixtureRanking(r.id));

  it("puts Dinda first for UI/UX with 92, as in PRD §3.1", () => {
    expect(uiux.candidates[0].profile.username).toBe("dinda");
    expect(uiux.candidates[0].score).toBe(92);
  });

  it("leaves team members out of every ranking", () => {
    const members = new Set(fixtureTeam.members.map((m) => m.profileId));
    for (const r of [backend, uiux, product]) {
      expect(r.candidates.some((c) => members.has(c.profile.id))).toBe(false);
      expect(r.total).toBe(r.candidates.length);
    }
  });

  it("gives every empty role at least one candidate and marks every profile simulated", () => {
    expect(uiux.total).toBeGreaterThan(1);
    expect(product.total).toBeGreaterThan(0);
    expect(fixtureProfiles.every((p) => p.isSimulated)).toBe(true);
  });
});
