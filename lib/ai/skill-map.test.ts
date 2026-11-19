import { describe, expect, it } from "vitest";
import { roleInputSchema } from "@/lib/validation/team";
import { GuidebookExtraction } from "./schemas";
import {
  buildSkillIndex,
  extractionToSuggestions,
  guessColorKey,
  pickUsableExtraction,
  templateToSuggestion,
  type SkillRow,
} from "./skill-map";
import { validExtraction } from "./test-fixtures";

const skills: SkillRow[] = [
  {
    id: 1,
    slug: "backend-development",
    name: "Backend Development",
    aliases: ["backend", "back-end"],
  },
  { id: 5, slug: "nodejs", name: "Node.js", aliases: ["node", "express"] },
  { id: 16, slug: "figma", name: "Figma", aliases: [] },
  { id: 17, slug: "user-research", name: "User Research", aliases: ["riset pengguna"] },
];
const index = buildSkillIndex(skills);
const extraction = GuidebookExtraction.parse(validExtraction);

describe("buildSkillIndex", () => {
  it("matches names, slugs and aliases without case, spaces, dots or dashes", () => {
    for (const name of ["Backend Development", "backend-development", "BACK-END", "back end"]) {
      expect(index.get(name.toLowerCase().replace(/[\s._-]+/g, ""))).toBe(1);
    }
    expect(index.get("nodejs")).toBe(5);
    expect(index.get("risetpengguna")).toBe(17);
  });
});

describe("extractionToSuggestions", () => {
  it("maps skills to ids and keeps the source, page and reason", () => {
    const [uiux, backend] = extractionToSuggestions(extraction, index);
    expect(uiux).toMatchObject({
      name: "UI/UX Designer",
      colorKey: "uiux",
      source: "criteria",
      sourcePage: 7,
      sourceCriterion: "Desain antarmuka",
      requiredSkills: [{ skillId: 16, minLevel: 2 }],
      optionalSkillIds: [17],
      unmatchedSkills: [],
      reason: "Ada kriteria Desain antarmuka 20%.",
    });
    expect(backend).toMatchObject({
      colorKey: "backend",
      requiredSkills: [{ skillId: 1, minLevel: 2 }],
    });
  });

  it("marks skills it cannot match as unmatched instead of dropping them", () => {
    const e = structuredClone(extraction);
    e.suggested_roles[0]!.required_skills.push({ skill: "Blender 3D", min_level: 3 });
    e.suggested_roles[0]!.optional_skills.push("Canva");
    const [role] = extractionToSuggestions(e, index);
    expect(role!.unmatchedSkills).toEqual([
      { name: "Blender 3D", minLevel: 3 },
      { name: "Canva", minLevel: null },
    ]);
  });

  it("does not list a skill twice or as both required and optional", () => {
    const e = structuredClone(extraction);
    e.suggested_roles[1]!.required_skills = [
      { skill: "Backend Development", min_level: 2 },
      { skill: "backend", min_level: 3 },
    ];
    e.suggested_roles[1]!.optional_skills = ["Back-End", "Node.js"];
    const [, role] = extractionToSuggestions(e, index);
    expect(role!.requiredSkills).toEqual([{ skillId: 1, minLevel: 2 }]);
    expect(role!.optionalSkillIds).toEqual([5]);
  });

  it("gives roles the role editor accepts once every skill is matched", () => {
    for (const s of extractionToSuggestions(extraction, index)) {
      expect(roleInputSchema.safeParse(s).success).toBe(true);
    }
  });
});

describe("guessColorKey", () => {
  it.each([
    ["UI/UX Designer", "uiux"],
    ["Backend Developer", "backend"],
    ["Software Engineer", "backend"],
    ["Frontend Developer", "frontend"],
    ["Mobile Developer", "frontend"],
    ["Data/AI Engineer", "data"],
    ["Data Analyst", "data"],
    ["Product dan Pitching", "product"],
    ["Business Analyst", "business"],
    ["Penulis Karya Ilmiah", "product"],
    ["Ketua Tim", "other"],
  ])("%s → %s", (name, key) => {
    expect(guessColorKey(name)).toBe(key);
  });
});

describe("templateToSuggestion", () => {
  it("turns a seed template into a valid role", () => {
    const s = templateToSuggestion({
      name: "Backend Developer",
      description: "Membangun server, API, dan database.",
      color_key: "backend",
      required_skills: [
        { skill_id: 1, min_level: 2 },
        { skill_id: 6, min_level: 2 },
      ],
      optional_skill_ids: [7, 8],
      hours_per_week: 10,
      slots: 1,
    });
    expect(s).toMatchObject({ source: "template", colorKey: "backend", sourcePage: null });
    expect(roleInputSchema.safeParse(s).success).toBe(true);
  });

  it("falls back to the other colour for an unknown key", () => {
    const s = templateToSuggestion({
      name: "X",
      description: null,
      color_key: "purple",
      required_skills: [],
      optional_skill_ids: [],
      hours_per_week: 5,
      slots: 1,
    });
    expect(s.colorKey).toBe("other");
  });
});

describe("pickUsableExtraction", () => {
  const data = (path: string) => ({ ...validExtraction, guidebook_path: path, roles: [] });
  const row = (
    id: string,
    status: "draft" | "reviewed" | "failed" | "processing",
    at: string,
    path = "a.pdf",
  ) => ({
    id,
    status,
    created_at: at,
    data: status === "failed" || status === "processing" ? null : data(path),
  });

  it("prefers the newest reviewed over a newer draft", () => {
    const rows = [
      row("d2", "draft", "2026-11-21T10:00:00Z"),
      row("r1", "reviewed", "2026-11-20T10:00:00Z"),
      row("r0", "reviewed", "2026-11-19T10:00:00Z"),
    ];
    expect(pickUsableExtraction(rows, "a.pdf")?.id).toBe("r1");
  });

  it("uses the newest draft when nothing is reviewed", () => {
    const rows = [
      row("d1", "draft", "2026-11-20T10:00:00Z"),
      row("f", "failed", "2026-11-22T10:00:00Z"),
      row("d2", "draft", "2026-11-21T10:00:00Z"),
    ];
    expect(pickUsableExtraction(rows, "a.pdf")?.id).toBe("d2");
  });

  it("ignores results for an older guidebook file", () => {
    const rows = [row("old", "reviewed", "2026-11-20T10:00:00Z", "old.pdf")];
    expect(pickUsableExtraction(rows, "a.pdf")).toBeNull();
  });

  it("returns null when every run failed or is still processing", () => {
    const rows = [
      row("f", "failed", "2026-11-20T10:00:00Z"),
      row("p", "processing", "2026-11-21T10:00:00Z"),
    ];
    expect(pickUsableExtraction(rows, "a.pdf")).toBeNull();
  });
});
