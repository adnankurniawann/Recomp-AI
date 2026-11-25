import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ManualGuidebook as ManualGuidebookSchema,
  ManualGuidebooks,
  PDF_CACHE_DIR,
  overallAccuracy,
  sameCriterion,
  scoreGuidebook,
  sha256Hex,
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

  it("pairs a repeated name with the row on its own page", () => {
    const twoRounds: ManualGuidebook = {
      ...manual,
      criteria: [
        { name: "Presentasi", pages: [12], weight_percent: 15 },
        { name: "Presentasi", pages: [13], weight_percent: 20 },
      ],
    };
    // The agent found only the second round's row.
    const s = scoreGuidebook(twoRounds, [{ name: "Presentasi", page: 13, weight_percent: 20 }]);
    expect(s.rows[0]).toMatchObject({ found: null });
    expect(s.rows[1]).toMatchObject({ found: "Presentasi", pageOk: true, weightOk: true });
    expect(s.correct).toBe(1);
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

describe("downloaded guidebooks", () => {
  const remote = {
    ...manual,
    pdf: `${PDF_CACHE_DIR}/tes.pdf`,
    url: "https://example.com/guidebook.pdf",
    sha256: "a".repeat(64),
  };

  it("need a sha256 and a path in the gitignored cache", () => {
    expect(ManualGuidebookSchema.safeParse(remote).success).toBe(true);
    expect(ManualGuidebookSchema.safeParse({ ...remote, sha256: undefined }).success).toBe(false);
    expect(ManualGuidebookSchema.safeParse({ ...remote, pdf: "supabase/x.pdf" }).success).toBe(
      false,
    );
  });

  it("are checked with a hex sha256", () => {
    expect(sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("eval/guidebooks.json", () => {
  const books = ManualGuidebooks.parse(JSON.parse(readFileSync("eval/guidebooks.json", "utf8")));

  it("holds 5 to 10 guidebooks with unique ids (PRD §8.1)", () => {
    expect(books.length).toBeGreaterThanOrEqual(5);
    expect(books.length).toBeLessThanOrEqual(10);
    expect(new Set(books.map((b) => b.id)).size).toBe(books.length);
  });

  it("points at a PDF in the repo or at the organiser's link", () => {
    for (const b of books) {
      if (b.url) expect(b.pdf).toBe(`${PDF_CACHE_DIR}/${b.id}.pdf`);
      else expect(() => readFileSync(b.pdf)).not.toThrow();
    }
  });
});
