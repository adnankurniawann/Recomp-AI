import { describe, expect, it } from "vitest";
import { GUIDEBOOK_JSON_SCHEMA, GuidebookExtraction, describeIssues } from "./schemas";
import { validExtraction } from "./test-fixtures";

describe("GuidebookExtraction", () => {
  it("accepts the PRD example shape", () => {
    expect(GuidebookExtraction.safeParse(validExtraction).success).toBe(true);
  });

  it("accepts null pages, weights and dates", () => {
    const v = structuredClone(validExtraction);
    v.team_size.page = null as never;
    v.deadlines[0]!.date = null as never;
    v.judging_criteria[0]!.weight_percent = null as never;
    expect(GuidebookExtraction.safeParse(v).success).toBe(true);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    const v = structuredClone(validExtraction);
    v.deadlines[0]!.date = "1 Desember 2026";
    expect(GuidebookExtraction.safeParse(v).success).toBe(false);
  });

  it("rejects more role slots than the team can hold", () => {
    const v = structuredClone(validExtraction);
    v.suggested_roles[1]!.slots = 3;
    expect(GuidebookExtraction.safeParse(v).success).toBe(true); // 1 + 3 = 4, the maximum
    v.suggested_roles[0]!.slots = 2;
    const r = GuidebookExtraction.safeParse(v);
    expect(r.success).toBe(false);
    expect(describeIssues(r.error!)).toContain("total slots (5) exceed the maximum team size (4)");
  });

  it("rejects a team size with min above max", () => {
    const v = structuredClone(validExtraction);
    v.team_size = { min: 5, max: 4, page: 2 };
    expect(GuidebookExtraction.safeParse(v).success).toBe(false);
  });

  it("rejects no roles and an unknown role source", () => {
    expect(GuidebookExtraction.safeParse({ ...validExtraction, suggested_roles: [] }).success).toBe(
      false,
    );
    const v = structuredClone(validExtraction);
    v.suggested_roles[0]!.source = "manual";
    expect(GuidebookExtraction.safeParse(v).success).toBe(false);
  });

  it("exports a JSON schema with every top-level field required", () => {
    const schema = GUIDEBOOK_JSON_SCHEMA as { type: string; required: string[] };
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "summary",
        "team_size",
        "deadlines",
        "judging_criteria",
        "suggested_roles",
        "warnings",
      ]),
    );
  });
});

describe("describeIssues", () => {
  it("lists one line per issue with its path", () => {
    const r = GuidebookExtraction.safeParse({ ...validExtraction, summary: 5 });
    expect(describeIssues(r.error!)).toMatch(/^- summary: /);
  });
});
