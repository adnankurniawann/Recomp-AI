import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ManualGuidebooks,
  overallAccuracy,
  sameCriterion,
  scoreGuidebook,
  type ManualGuidebook,
} from "./eval";

const manual: ManualGuidebook = {
  id: "tes",
  name: "Tes",
  pdf: "x.pdf",
  category: "hackathon",
  source: "tes",
  criteria: [
    { name: "Feasibility", pages: [17], weight_percent: 15 },
    { name: "Technical Feasibility", pages: [17], weight_percent: 20 },
    { name: "Communication", pages: [17, 18], weight_percent: 10 },
    { name: "Desain antarmuka", pages: [7], weight_percent: 20 },
  ],
};

describe("sameCriterion", () => {
  it("ignores case, punctuation and extra words, but not different criteria", () => {
    expect(sameCriterion("Desain Antarmuka (UI/UX)", "desain antarmuka")).toBe(true);
    expect(sameCriterion("Problem Fit & Usefulness", "Problem Fit and Usefulness")).toBe(true);
    expect(sameCriterion("Problem Clarity", "Problem Understanding")).toBe(false);
  });
});

describe("scoreGuidebook", () => {
  it("counts name and page as correct, a wrong page as name only, and lists extras", () => {
    const s = scoreGuidebook(manual, [
      { name: "Technical Feasibility", page: 17, weight_percent: 20 },
      { name: "Feasibility", page: 17, weight_percent: 15 },
      { name: "Communication", page: 18, weight_percent: 10 },
      { name: "Desain antarmuka", page: 8, weight_percent: 20 },
      { name: "Kreativitas", page: 9, weight_percent: null },
    ]);
    expect(s.total).toBe(4);
    expect(s.correct).toBe(3);
    expect(s.nameOnly).toBe(1);
    expect(s.extra).toEqual(["Kreativitas"]);
    // Exact names win: Feasibility didn't take Technical Feasibility.
    expect(s.rows[0]).toMatchObject({ expected: "Feasibility", found: "Feasibility" });
    expect(s.rows.every((r) => r.weightOk)).toBe(true);
  });

  it("treats a null page as wrong and a missing criterion as not found", () => {
    const s = scoreGuidebook(manual, [{ name: "Feasibility", page: null, weight_percent: 15 }]);
    expect(s.correct).toBe(0);
    expect(s.rows[1]).toMatchObject({ found: null, nameOk: false });
  });
});

describe("overallAccuracy", () => {
  it("adds up every guidebook, one decimal", () => {
    const a = { id: "a", total: 4, correct: 3, nameOnly: 1, extra: [], rows: [] };
    const b = { id: "b", total: 2, correct: 2, nameOnly: 0, extra: [], rows: [] };
    expect(overallAccuracy([a, b])).toEqual({ correct: 5, total: 6, percent: 83.3 });
    expect(overallAccuracy([]).percent).toBeNull();
  });
});

describe("eval/guidebooks.json", () => {
  it("matches the schema and points at PDFs in the repo", () => {
    const books = ManualGuidebooks.parse(JSON.parse(readFileSync("eval/guidebooks.json", "utf8")));
    expect(books.length).toBeGreaterThan(0);
    for (const b of books) expect(() => readFileSync(b.pdf)).not.toThrow();
  });
});
