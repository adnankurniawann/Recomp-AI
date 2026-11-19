import { describe, expect, it } from "vitest";
import { dinda, FIGMA, skillNames, team, uiuxRole, USER_RESEARCH } from "./example";
import { DEFAULT_MATCHING_CONFIG as cfg, rankCandidates, scoreCandidate } from "./score";
import type { CandidateInput } from "./types";

const score = (c: CandidateInput) => scoreCandidate(uiuxRole, c, team, cfg, skillNames);

describe("scoreCandidate (PRD §7.6)", () => {
  it("1. scores Dinda 92 with the factors in the table", () => {
    const r = score(dinda)!;
    expect(r.score).toBe(92);
    expect(r.factors.coverage).toBeCloseTo(1, 3);
    expect(r.factors.level).toBeCloseTo(0.925, 3);
    expect(r.factors.availability).toBeCloseTo(0.75, 3);
    expect(r.factors.experience).toBeCloseTo(0.867, 3);
    expect(r.factors.fit).toBeCloseTo(1, 3);
    expect(r.matchedRequired).toEqual([FIGMA, USER_RESEARCH]);
    expect(r.missingRequired).toEqual([]);
  });

  it("2. returns null for a candidate without any required skill", () => {
    expect(score({ ...dinda, skills: [{ skillId: 999, level: 4, hasEvidence: true }] })).toBeNull();
  });

  it("3. scores evidence higher than no evidence", () => {
    const noEvidence = { ...dinda, skills: dinda.skills.map((s) => ({ ...s, hasEvidence: false })) };
    expect(score(dinda)!.score).toBeGreaterThan(score(noEvidence)!.score);
  });

  it("4. follows the weights in the config", () => {
    const onlyAvailability = {
      ...cfg,
      weights: { coverage: 0, level: 0, availability: 1, experience: 0, fit: 0 },
    };
    expect(scoreCandidate(uiuxRole, dinda, team, onlyAvailability, skillNames)!.score).toBe(75);
    const onlyLevel = { ...cfg, weights: { ...onlyAvailability.weights, availability: 0, level: 1 } };
    expect(scoreCandidate(uiuxRole, dinda, team, onlyLevel, skillNames)!.score).toBe(93); // 0.925
  });

  it("5. ignores campus, entry year and every other banned attribute", () => {
    const banned = ["campus", "entryYear", "gender", "religion", "ethnicity", "avatarUrl", "age"];
    const a = { ...dinda, campus: "ITB", entryYear: 2022 } as CandidateInput;
    const b = { ...dinda, campus: "UI", entryYear: 2025 } as CandidateInput;
    expect(score(a)!.score).toBe(score(b)!.score);
    // Reading a banned key at all fails the test.
    const guarded = new Proxy(a, {
      get(target, key, recv) {
        if (banned.includes(String(key))) throw new Error(`score read ${String(key)}`);
        return Reflect.get(target, key, recv);
      },
    });
    expect(score(guarded)!.score).toBe(92);
  });

  it("6. breaks ties by required skills with evidence, then the newest profile", () => {
    const role = { ...uiuxRole, requiredSkills: [{ skillId: FIGMA, minLevel: 2 as const }], optionalSkillIds: [], hoursPerWeek: 20 };
    const base = { ...dinda, history: [], preferredRoles: [] };
    // Evidence gives +0.15 level (×0.2); 17/20 hours takes −0.15 availability (×0.2). Same score.
    const withEvidence = { ...base, profileId: "evidence", hoursPerWeek: 17, skills: [{ skillId: FIGMA, level: 2 as const, hasEvidence: true }] };
    const older = { ...base, profileId: "older", hoursPerWeek: 20, skills: [{ skillId: FIGMA, level: 2 as const, hasEvidence: false }], updatedAt: "2026-01-01T00:00:00Z" };
    const newer = { ...older, profileId: "newer", updatedAt: "2026-06-01T00:00:00Z" };
    const ranked = rankCandidates(role, [older, newer, withEvidence], team, cfg, skillNames);
    expect(new Set(ranked.map((r) => r.score)).size).toBe(1);
    expect(ranked.map((r) => r.profileId)).toEqual(["evidence", "newer", "older"]);
  });

  it("7. gives 0.4 more fit to a candidate who prefers the role", () => {
    const notPreferred = { ...dinda, preferredRoles: ["product" as const] };
    expect(score(dinda)!.factors.fit - score(notPreferred)!.factors.fit).toBeCloseTo(0.4, 6);
  });

  it("drops candidates without a required skill from the ranking", () => {
    const none = { ...dinda, profileId: "none", skills: [] };
    expect(rankCandidates(uiuxRole, [none, dinda], team, cfg, skillNames).map((r) => r.profileId)).toEqual(["dinda"]);
  });
});
