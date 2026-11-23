import { describe, expect, it } from "vitest";
import { createTeamSchema, roleInputSchema, saveRolesSchema, totalSlots } from "./team";

const role = {
  name: "UI/UX Designer",
  colorKey: "uiux",
  source: "criteria",
  sourcePage: 7,
  sourceCriterion: "Desain antarmuka 20%",
  edited: false,
  requiredSkills: [
    { skillId: 12, minLevel: 2 },
    { skillId: 13, minLevel: 1 },
  ],
  optionalSkillIds: [14],
  hoursPerWeek: 8,
  slots: 1,
};

const team = {
  competitionId: "3f0b6a52-4c1e-4d7a-9b8e-2a1c5d6e7f80",
  name: "Tim Ombak",
  goal: "win",
  workTime: "night",
  roles: [role, { ...role, name: "Backend Developer", colorKey: "backend" }],
  leaderRoleIndex: 1,
};

describe("roleInputSchema", () => {
  it("accepts the PRD example role", () => {
    expect(roleInputSchema.safeParse(role).success).toBe(true);
  });

  it.each([
    ["a one-letter name", { name: "A" }],
    ["a name over 40 characters", { name: "a".repeat(41) }],
    ["a description over 200 characters", { description: "a".repeat(201) }],
    ["no required skill", { requiredSkills: [] }],
    [
      "a required skill twice",
      {
        requiredSkills: [
          { skillId: 12, minLevel: 2 },
          { skillId: 12, minLevel: 3 },
        ],
      },
    ],
    ["min level 5", { requiredSkills: [{ skillId: 12, minLevel: 5 }] }],
    ["0 hours", { hoursPerWeek: 0 }],
    ["41 hours", { hoursPerWeek: 41 }],
    ["4 slots", { slots: 4 }],
    ["an unknown colour key", { colorKey: "pink" }],
    ["an unknown source", { source: "llm" }],
  ])("rejects %s", (_label, patch) => {
    expect(roleInputSchema.safeParse({ ...role, ...patch }).success).toBe(false);
  });
});

describe("createTeamSchema", () => {
  it("accepts a valid team", () => {
    expect(createTeamSchema.safeParse(team).success).toBe(true);
  });

  it("rejects a leader role index outside the roles", () => {
    const result = createTeamSchema.safeParse({ ...team, leaderRoleIndex: 2 });
    expect(result.error?.issues[0]?.path).toEqual(["leaderRoleIndex"]);
  });

  it("rejects a team with no roles or more than 6", () => {
    expect(createTeamSchema.safeParse({ ...team, roles: [], leaderRoleIndex: 0 }).success).toBe(
      false,
    );
    const seven = Array.from({ length: 7 }, () => role);
    expect(createTeamSchema.safeParse({ ...team, roles: seven }).success).toBe(false);
  });

  it("rejects a non-uuid competition", () => {
    expect(createTeamSchema.safeParse({ ...team, competitionId: "lomba-1" }).success).toBe(false);
  });
});

describe("createTeamSchema invites", () => {
  const id = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

  it("defaults to no invites and accepts one per student", () => {
    expect(createTeamSchema.parse(team).invites).toEqual([]);
    expect(
      createTeamSchema.safeParse({ ...team, invites: [{ profileId: id, roleIndex: 0 }] }).success,
    ).toBe(true);
  });

  it("rejects a duplicate student or a role outside the list", () => {
    const twice = [
      { profileId: id, roleIndex: 0 },
      { profileId: id, roleIndex: 1 },
    ];
    expect(createTeamSchema.safeParse({ ...team, invites: twice }).success).toBe(false);
    expect(
      createTeamSchema.safeParse({ ...team, invites: [{ profileId: id, roleIndex: 2 }] }).success,
    ).toBe(false);
  });
});

describe("saveRolesSchema and totalSlots", () => {
  it("validates roles for an existing team", () => {
    expect(
      saveRolesSchema.safeParse({ teamId: team.competitionId, roles: team.roles }).success,
    ).toBe(true);
  });

  it("sums slots", () => {
    expect(totalSlots([{ slots: 1 }, { slots: 2 }, { slots: 3 }])).toBe(6);
    expect(totalSlots([])).toBe(0);
  });
});
