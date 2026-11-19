import { describe, expect, it } from "vitest";
import { dinda, FIGMA, skillNames, team, uiuxRole, USER_RESEARCH } from "./example";
import { DEFAULT_MATCHING_CONFIG as cfg, scoreCandidate } from "./score";
import type { CandidateInput } from "./types";

const reasons = (c: CandidateInput, t = team) =>
  scoreCandidate(uiuxRole, c, t, cfg, skillNames)!.reasons;
const codes = (c: CandidateInput, t = team) => reasons(c, t).map((r) => r.code);
const text = (c: CandidateInput, code: string) => reasons(c).find((r) => r.code === code)?.text;

describe("buildReasons (PRD §7.4)", () => {
  it("orders Dinda's reasons by the strongest factor, as in the ranking wireframe", () => {
    expect(codes(dinda).slice(0, 3)).toEqual([
      "coverage_full",
      "skill_evidence",
      "availability_short",
    ]);
  });

  it("coverage_full names every required skill", () => {
    expect(text(dinda, "coverage_full")).toBe("Menutup semua skill wajib: Figma, User Research");
  });

  it("coverage_partial counts what is covered", () => {
    const c = { ...dinda, skills: dinda.skills.filter((s) => s.skillId !== USER_RESEARCH) };
    expect(text(c, "coverage_partial")).toBe("Menutup 1 dari 2 skill wajib: Figma");
    expect(codes(c)).not.toContain("coverage_full");
  });

  it("skill_evidence needs level 3 or more and evidence", () => {
    expect(text(dinda, "skill_evidence")).toBe("Figma level Mahir, ada bukti portofolio");
    const noEvidence = {
      ...dinda,
      skills: dinda.skills.map((s) => ({ ...s, hasEvidence: false })),
    };
    expect(codes(noEvidence)).not.toContain("skill_evidence");
    const level2 = { ...dinda, skills: [{ skillId: FIGMA, level: 2 as const, hasEvidence: true }] };
    expect(codes(level2)).not.toContain("skill_evidence");
  });

  it("experience shows from 0.6 and counts podiums", () => {
    expect(text(dinda, "experience")).toBe("Pernah ikut 2 hackathon, sekali finalis");
    const winner = {
      ...dinda,
      history: [{ category: "hackathon" as const, result: "winner_1" as const }],
    };
    expect(text(winner, "experience")).toBeUndefined(); // 1/3 + 0.2 = 0.53
    const three = {
      ...dinda,
      history: [...dinda.history, { category: "hackathon" as const, result: "winner_2" as const }],
    };
    expect(text(three, "experience")).toBe("Pernah ikut 3 hackathon, sekali juara, sekali finalis");
  });

  it("availability_short and availability_full", () => {
    expect(text(dinda, "availability_short")).toBe(
      "6 jam per minggu, 2 jam di bawah kebutuhan role",
    );
    expect(text({ ...dinda, hoursPerWeek: 10 }, "availability_full")).toBe(
      "Bisa 10 jam per minggu, sesuai kebutuhan role",
    );
  });

  it("preferred_role names the role", () => {
    expect(text(dinda, "preferred_role")).toBe("Memang berminat jadi UI/UX Designer");
    expect(codes({ ...dinda, preferredRoles: ["backend"] })).not.toContain("preferred_role");
  });

  it("goal_worktime needs the same goal and a matching or flexible work time", () => {
    expect(text(dinda, "goal_worktime")).toBe("Tujuan dan jam kerja sama dengan tim");
    expect(codes({ ...dinda, workTime: "flexible" })).toContain("goal_worktime");
    expect(codes({ ...dinda, workTime: "morning" })).not.toContain("goal_worktime");
    expect(codes({ ...dinda, goal: "learn" })).not.toContain("goal_worktime");
  });
});
