import { describe, expect, it } from "vitest";
import { toGuidebookSummary } from "./guidebook-summary";
import { GuidebookExtraction } from "./schemas";
import { buildSkillIndex, extractionToSuggestions, type StoredExtraction } from "./skill-map";
import { validExtraction } from "./test-fixtures";

const skills = [
  { id: 1, slug: "backend-development", name: "Backend Development", aliases: [] },
  { id: 16, slug: "figma", name: "Figma", aliases: [] },
  { id: 17, slug: "user-research", name: "User Research", aliases: [] },
];
const extraction = GuidebookExtraction.parse(validExtraction);
const data: StoredExtraction = {
  ...extraction,
  guidebook_path: "a.pdf",
  roles: extractionToSuggestions(extraction, buildSkillIndex(skills)),
};
const names = new Map(skills.map((s) => [s.id, s.name]));

describe("toGuidebookSummary", () => {
  const summary = toGuidebookSummary({ id: "e1", status: "draft", data }, "hackathon", names);

  it("marks a draft so the tab shows the not-yet-checked note", () => {
    expect(summary.isDraft).toBe(true);
    expect(
      toGuidebookSummary({ id: "e1", status: "reviewed", data }, "hackathon", names).isDraft,
    ).toBe(false);
  });

  it("carries summary, criteria and deadlines with their pages", () => {
    expect(summary.summary).toBe(extraction.summary);
    expect(summary.criteria[0]).toEqual({ name: "Desain antarmuka", weightPercent: 20, page: 7 });
    expect(summary.deadlines[0]).toEqual({ name: "Pendaftaran", date: "2026-12-01", page: 3 });
    expect(summary.teamSize).toEqual({ min: 3, max: 4, page: 2 });
  });

  it("gives each role its source label and skill names, required first", () => {
    expect(summary.roles[0]).toEqual({
      name: "UI/UX Designer",
      colorKey: "uiux",
      sourceLabel: "Dari kriteria Desain antarmuka 20% (hal. 7)",
      skills: [
        { name: "Figma", required: true },
        { name: "User Research", required: false },
      ],
    });
    expect(summary.roles[1]?.sourceLabel).toBe("Dari guidebook hal. 4");
  });

  it("skips a skill id it has no name for instead of showing a number", () => {
    const s = toGuidebookSummary({ id: "e1", status: "draft", data }, "hackathon", new Map());
    expect(s.roles[0]?.skills).toEqual([]);
  });
});
