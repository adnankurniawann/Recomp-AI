import { describe, expect, it } from "vitest";
import { CASE_FEEDBACK_ERRORS, alignWithRubric, runCaseFeedbackAgent } from "./case-feedback";
import type { GenerateJson } from "./guidebook";
import type { RubricItem } from "./prompts/case-feedback";
import { CASE_FEEDBACK_JSON_SCHEMA, CaseFeedback } from "./schemas";

const rubric: RubricItem[] = [
  { criterion: "Masalah jelas", description: "Siapa dan apa masalahnya", max_score: 5 },
  { criterion: "Bukti", description: "Ada data atau observasi", max_score: 3 },
];

const score = (criterion: string, value: number, max = 5) => ({
  criterion,
  score: value,
  max_score: max,
  quote: "mahasiswa sulit cari tim",
  comment: "Sudah jelas siapa penggunanya.",
  suggestion: "Tambahkan seberapa sering masalah ini terjadi.",
});

const valid: CaseFeedback = {
  scores: [score("Masalah jelas", 4), score("Bukti", 2, 3)],
  overall: "Jawaban sudah fokus, tinggal tambah bukti.",
};

function fakeLlm(...answers: (string | Error)[]) {
  const calls: Parameters<GenerateJson>[0][] = [];
  const generate: GenerateJson = async (req) => {
    calls.push({ ...req, turns: [...req.turns] });
    const next = answers[calls.length - 1];
    if (next instanceof Error) throw next;
    return next ?? "";
  };
  return { generate, calls };
}

const base = { promptMd: "Tulis problem statement.", rubric, answer: "Mahasiswa sulit cari tim." };

describe("alignWithRubric", () => {
  it("orders scores like the rubric, matches names loosely and clamps to the rubric max", () => {
    const { feedback, missing } = alignWithRubric(
      {
        ...valid,
        scores: [score(" bukti ", 9, 10), score("MASALAH  JELAS", -1), score("Lain", 3)],
      },
      rubric,
    );
    expect(missing).toEqual([]);
    expect(feedback.scores.map((s) => [s.criterion, s.score, s.max_score])).toEqual([
      ["Masalah jelas", 0, 5],
      ["Bukti", 3, 3],
    ]);
  });

  it("lists the criteria the model skipped", () => {
    const { missing } = alignWithRubric({ ...valid, scores: [score("Bukti", 2, 3)] }, rubric);
    expect(missing).toEqual(["Masalah jelas"]);
  });
});

describe("runCaseFeedbackAgent", () => {
  it("returns feedback with totals from valid JSON", async () => {
    const llm = fakeLlm(JSON.stringify(valid));
    const r = await runCaseFeedbackAgent({ ...base, generate: llm.generate });
    expect(r).toMatchObject({ status: "ok", totalScore: 6, maxScore: 8 });
    expect(llm.calls).toHaveLength(1);
    expect(llm.calls[0]!.jsonSchema).toBe(CASE_FEEDBACK_JSON_SCHEMA);
    expect(llm.calls[0]!.turns[0]!.text).toContain("Mahasiswa sulit cari tim.");
    expect(llm.calls[0]!.turns[0]!.text).toContain('"max_score":5');
  });

  it("retries once with the reason when a criterion is missing", async () => {
    const partial = { ...valid, scores: [score("Bukti", 2, 3)] };
    const llm = fakeLlm(JSON.stringify(partial), JSON.stringify(valid));
    const r = await runCaseFeedbackAgent({ ...base, generate: llm.generate });
    expect(r.status).toBe("ok");
    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[1]!.turns.at(-1)!.text).toContain('missing criteria "Masalah jelas"');
  });

  it("fails after two answers that don't match the schema", async () => {
    const llm = fakeLlm("not json", JSON.stringify({ scores: [] }));
    const r = await runCaseFeedbackAgent({ ...base, generate: llm.generate });
    expect(r).toEqual({ status: "failed", error: CASE_FEEDBACK_ERRORS.invalid });
    expect(llm.calls).toHaveLength(2);
  });

  it("fails without throwing when the LLM call errors", async () => {
    const llm = fakeLlm(new Error("503"));
    const r = await runCaseFeedbackAgent({ ...base, generate: llm.generate });
    expect(r).toEqual({ status: "failed", error: CASE_FEEDBACK_ERRORS.failed });
  });
});

describe("CaseFeedback schema", () => {
  it("rejects a comment over 400 characters and a missing overall", () => {
    expect(CaseFeedback.safeParse(valid).success).toBe(true);
    const long = { ...valid, scores: [{ ...valid.scores[0]!, comment: "a".repeat(401) }] };
    expect(CaseFeedback.safeParse(long).success).toBe(false);
    expect(CaseFeedback.safeParse({ scores: valid.scores }).success).toBe(false);
  });

  it("sends Gemini the shape without length limits", () => {
    expect(JSON.stringify(CASE_FEEDBACK_JSON_SCHEMA)).not.toContain("maxLength");
  });
});
