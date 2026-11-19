import { describe, expect, it } from "vitest";
import { requiredSkillIdsFromJson, suggestSkillIds, type RoleTemplateSkills } from "./suggest";

// Skill ids for readability: Figma 12, User Research 13, Prototyping 14, Design System 15,
// Illustration 16, Product Management 24, Business Model 25, Pitch Deck 28, Public Speaking 30.
const templates: RoleTemplateSkills[] = [
  // A UI/UX template from the ui_ux category, with a lower sort than the hackathon one
  {
    category: "ui_ux",
    colorKey: "uiux",
    sort: 0,
    requiredSkillIds: [12, 16],
    optionalSkillIds: [15],
  },
  {
    category: "hackathon",
    colorKey: "product",
    sort: 4,
    requiredSkillIds: [30, 24],
    optionalSkillIds: [25, 28],
  },
  {
    category: "hackathon",
    colorKey: "uiux",
    sort: 2,
    requiredSkillIds: [12, 13],
    optionalSkillIds: [14, 15],
  },
  {
    category: "hackathon",
    colorKey: "backend",
    sort: 0,
    requiredSkillIds: [1, 6],
    optionalSkillIds: [7, 8],
  },
];

describe("suggestSkillIds", () => {
  it("puts Figma, User Research, Prototyping and Design System first for UI/UX (PRD F-PRF-01)", () => {
    expect(suggestSkillIds(templates, ["uiux"]).slice(0, 4)).toEqual([12, 13, 14, 15]);
  });

  it("adds other categories' templates after the hackathon one, without repeats", () => {
    expect(suggestSkillIds(templates, ["uiux"])).toEqual([12, 13, 14, 15, 16]);
  });

  it("follows the order the student picked the roles in", () => {
    expect(suggestSkillIds(templates, ["product", "uiux"])).toEqual([
      30, 24, 25, 28, 12, 13, 14, 15, 16,
    ]);
  });

  it("suggests nothing without roles or templates", () => {
    expect(suggestSkillIds(templates, [])).toEqual([]);
    expect(suggestSkillIds([], ["data"])).toEqual([]);
  });
});

describe("requiredSkillIdsFromJson", () => {
  it("reads skill ids and skips bad items", () => {
    const json = [
      { skill_id: 12, min_level: 2 },
      { skill_id: "13" },
      null,
      { min_level: 1 },
      { skill_id: 14 },
    ];
    expect(requiredSkillIdsFromJson(json)).toEqual([12, 14]);
  });

  it("returns an empty list for non-arrays", () => {
    expect(requiredSkillIdsFromJson(null)).toEqual([]);
    expect(requiredSkillIdsFromJson({ skill_id: 1 })).toEqual([]);
  });
});
