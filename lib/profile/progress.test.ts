import { describe, expect, it } from "vitest";
import { resumeStep, type SavedProfileState } from "./progress";

const complete: SavedProfileState = {
  username: "dinda_p",
  campus: "Institut Contoh",
  major: "DKV",
  entryYear: 2024,
  preferredRoleCount: 2,
  skillCount: 3,
  hasWhatsapp: true,
};

describe("resumeStep", () => {
  it("starts a new profile at step 1", () => {
    const fresh = {
      ...complete,
      username: null,
      campus: null,
      major: null,
      entryYear: null,
      preferredRoleCount: 0,
      skillCount: 0,
      hasWhatsapp: false,
    };
    expect(resumeStep(fresh)).toBe(1);
  });

  it("stays on step 1 while campus or year is missing", () => {
    expect(resumeStep({ ...complete, campus: "" })).toBe(1);
    expect(resumeStep({ ...complete, entryYear: null })).toBe(1);
  });

  it("goes to step 2 until there is a role and three skills", () => {
    expect(resumeStep({ ...complete, preferredRoleCount: 0 })).toBe(2);
    expect(resumeStep({ ...complete, skillCount: 2 })).toBe(2);
  });

  it("goes to step 3 when contacts aren't saved yet", () => {
    expect(resumeStep({ ...complete, hasWhatsapp: false })).toBe(3);
  });

  it("goes to step 4 when everything is saved", () => {
    expect(resumeStep(complete)).toBe(4);
  });
});
