import { describe, expect, it } from "vitest";
import { roleSourceLabel } from "./role-source";

const criteria = [
  { name: "Desain antarmuka", weight_percent: 20 },
  { name: "Presentasi", weight_percent: null },
];
const ctx = { category: "hackathon" as const, criteria };
const role = (
  source: "guidebook" | "criteria" | "template" | "manual",
  page: number | null,
  criterion: string | null = null,
) => ({
  source,
  sourcePage: page,
  sourceCriterion: criterion,
});

describe("roleSourceLabel", () => {
  it("names the guidebook page", () => {
    expect(roleSourceLabel(role("guidebook", 3), ctx)).toBe("Dari guidebook hal. 3");
    expect(roleSourceLabel(role("guidebook", null), ctx)).toBe("Dari guidebook");
  });

  it("names the criterion with its weight and page, as in PRD F-TEM-02", () => {
    expect(roleSourceLabel(role("criteria", 7, "Desain antarmuka"), ctx)).toBe(
      "Dari kriteria Desain antarmuka 20% (hal. 7)",
    );
  });

  it("matches the criterion without case and skips a missing weight or page", () => {
    expect(roleSourceLabel(role("criteria", 8, "presentasi"), ctx)).toBe(
      "Dari kriteria presentasi (hal. 8)",
    );
    expect(roleSourceLabel(role("criteria", null, "Inovasi"), ctx)).toBe("Dari kriteria Inovasi");
    expect(roleSourceLabel(role("criteria", 4), ctx)).toBe("Dari kriteria (hal. 4)");
  });

  it("names the template by category and a manual role by the leader", () => {
    expect(roleSourceLabel(role("template", null), ctx)).toBe("Template hackathon");
    expect(roleSourceLabel(role("template", null), { category: "it_competition" })).toBe(
      "Template lomba IT",
    );
    expect(roleSourceLabel(role("manual", null), ctx)).toBe("Ditambah ketua");
  });
});
