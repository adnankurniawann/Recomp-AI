// The worked example of PRD §7.6, shared by the unit tests. Skill ids match supabase/seed.sql.
import type { CandidateInput, RoleRequirement, SkillNames, TeamContext } from "./types";

export const FIGMA = 16;
export const USER_RESEARCH = 17;
export const PROTOTYPING = 18;

export const skillNames: SkillNames = new Map([
  [FIGMA, "Figma"],
  [USER_RESEARCH, "User Research"],
  [PROTOTYPING, "Prototyping"],
]);

export const uiuxRole: RoleRequirement = {
  id: "role-uiux",
  name: "UI/UX Designer",
  colorKey: "uiux",
  requiredSkills: [
    { skillId: FIGMA, minLevel: 2 },
    { skillId: USER_RESEARCH, minLevel: 1 },
  ],
  optionalSkillIds: [PROTOTYPING],
  hoursPerWeek: 8,
};

export const team: TeamContext = { competitionCategory: "hackathon", goal: "win", workTime: "night" };

export const dinda: CandidateInput = {
  profileId: "dinda",
  preferredRoles: ["uiux", "product"],
  skills: [
    { skillId: FIGMA, level: 3, hasEvidence: true },
    { skillId: USER_RESEARCH, level: 2, hasEvidence: false },
    { skillId: PROTOTYPING, level: 2, hasEvidence: false },
  ],
  hoursPerWeek: 6,
  goal: "win",
  workTime: "night",
  history: [
    { category: "hackathon", result: "finalist" },
    { category: "hackathon", result: "participant" },
  ],
  updatedAt: "2026-11-01T00:00:00Z",
};
