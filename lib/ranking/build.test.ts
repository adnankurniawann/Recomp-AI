import { describe, expect, it } from "vitest";
import { FIGMA, PROTOTYPING, USER_RESEARCH } from "@/lib/matching/example";
import { DEFAULT_MATCHING_CONFIG } from "@/lib/matching/score";
import { buildRankingPage, RankingSource, toMatchingConfig } from "./build";

type Cand = RankingSource["candidates"][number];

// Dinda from PRD §7.6, in the shape ranking_candidates returns.
const dinda: Cand = {
  id: "p-dinda",
  username: "dinda",
  full_name: "Dinda Putri",
  avatar_url: null,
  campus: "ITB",
  major: "DKV",
  entry_year: 2024,
  preferred_roles: ["uiux", "product"],
  is_simulated: true,
  hours_per_week: 6,
  goal: "win",
  work_time: "night",
  updated_at: "2026-11-01T00:00:00Z",
  skills: [
    { skill_id: FIGMA, level: 3, has_evidence: true },
    { skill_id: USER_RESEARCH, level: 2, has_evidence: false },
    { skill_id: PROTOTYPING, level: 2, has_evidence: false },
  ],
  history: [
    { category: "hackathon", result: "finalist" },
    { category: "hackathon", result: "participant" },
  ],
};

const source = (candidates: Cand[], config: unknown = null) =>
  RankingSource.parse({
    role: {
      id: "r-uiux",
      name: "UI/UX Designer",
      color_key: "uiux",
      required_skills: [
        { skill_id: FIGMA, min_level: 2 },
        { skill_id: USER_RESEARCH, min_level: 1 },
      ],
      optional_skill_ids: [PROTOTYPING],
      hours_per_week: 8,
    },
    team: { goal: "win", work_time: "night", category: "hackathon" },
    config,
    skill_names: [
      { id: FIGMA, name: "Figma" },
      { id: USER_RESEARCH, name: "User Research" },
      { id: PROTOTYPING, name: "Prototyping" },
    ],
    candidates,
  });

const page = { limit: 20, offset: 0 };

describe("buildRankingPage", () => {
  it("scores Dinda 92 and fills the PRD §13.2 shape", () => {
    const res = buildRankingPage(source([dinda]), page);
    expect(res.total).toBe(1);
    expect(res.role).toEqual({
      id: "r-uiux",
      name: "UI/UX Designer",
      colorKey: "uiux",
      requiredSkills: [
        { skillId: FIGMA, minLevel: 2, name: "Figma" },
        { skillId: USER_RESEARCH, minLevel: 1, name: "User Research" },
      ],
      hoursPerWeek: 8,
    });
    const [c] = res.candidates;
    expect(c!.score).toBe(92);
    expect(c!.profile).toMatchObject({ id: "p-dinda", fullName: "Dinda Putri", isSimulated: true });
    expect(c!.weights).toEqual(DEFAULT_MATCHING_CONFIG.weights);
    expect(c!.matchedRequired).toEqual([
      { skillId: FIGMA, name: "Figma", level: 3, hasEvidence: true },
      { skillId: USER_RESEARCH, name: "User Research", level: 2, hasEvidence: false },
    ]);
    expect(c!.missingRequired).toEqual([]);
    expect(c!.reasons[0]?.code).toBe("coverage_full");
    expect(c!.inviteStatus).toBeNull();
  });

  it("drops candidates with no required skill (filter 7) and orders by score", () => {
    const partial: Cand = {
      ...dinda,
      id: "p-partial",
      skills: [{ skill_id: FIGMA, level: 2, has_evidence: false }],
    };
    const none: Cand = {
      ...dinda,
      id: "p-none",
      skills: [{ skill_id: PROTOTYPING, level: 4, has_evidence: true }],
    };
    const res = buildRankingPage(source([partial, none, dinda]), page);
    expect(res.total).toBe(2);
    expect(res.candidates.map((c) => c.profile.id)).toEqual(["p-dinda", "p-partial"]);
    expect(res.candidates[1]!.missingRequired).toEqual([
      { skillId: USER_RESEARCH, name: "User Research", minLevel: 1 },
    ]);
  });

  it("slices pages after sorting and keeps the full total", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...dinda,
      id: `p-${i}`,
      hours_per_week: 2 + i, // more hours, higher score
    }));
    const first = buildRankingPage(source(many), { limit: 2, offset: 0 });
    const second = buildRankingPage(source(many), { limit: 2, offset: 2 });
    expect(first.total).toBe(5);
    expect(first.candidates.map((c) => c.profile.id)).toEqual(["p-4", "p-3"]);
    expect(second.candidates.map((c) => c.profile.id)).toEqual(["p-2", "p-1"]);
    expect(buildRankingPage(source(many), { limit: 2, offset: 10 }).candidates).toEqual([]);
  });

  it("never lets campus, major or entry year change the score (PRD §7.3)", () => {
    const other: Cand = { ...dinda, id: "p-other", campus: "Lain", major: null, entry_year: 2019 };
    const [a, b] = buildRankingPage(source([dinda, other]), page).candidates;
    expect(a!.score).toBe(b!.score);
    expect(a!.factors).toEqual(b!.factors);
  });

  it("uses the active matching_config row, numeric strings included", () => {
    const cfg = {
      weights: { coverage: 1, level: 0, availability: 0, experience: 0, fit: 0 },
      no_evidence_factor: "0.85",
      optional_bonus: "0.1",
      experience_cap: 3,
      podium_bonus: "0.2",
    };
    const res = buildRankingPage(source([dinda], cfg), page);
    expect(res.candidates[0]!.score).toBe(100);
    expect(res.candidates[0]!.weights.coverage).toBe(1);
  });

  it("falls back to the default config and to a placeholder skill name", () => {
    expect(toMatchingConfig(null)).toBe(DEFAULT_MATCHING_CONFIG);
    const s = source([dinda]);
    const res = buildRankingPage({ ...s, skill_names: [] }, page);
    expect(res.role.requiredSkills[0]!.name).toBe(`Skill #${FIGMA}`);
  });
});

describe("RankingSource", () => {
  it("rejects a candidate with a level outside 1–4", () => {
    const bad = { ...dinda, skills: [{ skill_id: FIGMA, level: 5, has_evidence: false }] };
    expect(() => source([bad as Cand])).toThrow();
  });

  it("treats an unknown role colour as other", () => {
    const s = source([]);
    const parsed = RankingSource.parse({ ...s, role: { ...s.role, color_key: "purple" } });
    expect(parsed.role.color_key).toBe("other");
  });
});
