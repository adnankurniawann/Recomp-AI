import { describe, expect, it } from "vitest";
import { isRoleFilled, skillGap } from "./gap";

describe("isRoleFilled", () => {
  it("is filled only when members reach the slots", () => {
    expect(isRoleFilled({ slots: 2, memberCount: 1 })).toBe(false);
    expect(isRoleFilled({ slots: 2, memberCount: 2 })).toBe(true);
  });
});

describe("skillGap", () => {
  it("takes required skills of unfilled roles only, without repeats", () => {
    expect(
      skillGap([
        { slots: 1, memberCount: 1, requiredSkillIds: [1, 2] },
        { slots: 2, memberCount: 1, requiredSkillIds: [3, 4] },
        { slots: 1, memberCount: 0, requiredSkillIds: [4, 5] },
      ]),
    ).toEqual([3, 4, 5]);
  });

  it("is empty when every role is filled", () => {
    expect(skillGap([{ slots: 1, memberCount: 1, requiredSkillIds: [1] }])).toEqual([]);
  });
});
