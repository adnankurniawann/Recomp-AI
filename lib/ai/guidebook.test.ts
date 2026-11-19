import { describe, expect, it } from "vitest";
import { makePdf } from "@/lib/pdf/make-test-pdf";
import { SCANNED_PDF_MESSAGE, TRUNCATED_PDF_WARNING } from "@/lib/pdf/extract";
import { GUIDEBOOK_ERRORS, runGuidebookAgent, type GenerateJson } from "./guidebook";
import { validExtraction } from "./test-fixtures";

const pdf = makePdf([
  "Hackathon Kota Pintar 2026. Setiap tim terdiri dari 3 sampai 4 mahasiswa aktif.",
  "Kriteria penilaian: Desain antarmuka 20 persen, Presentasi 15 persen, Teknis 40 persen.",
]);
const base = {
  pdf,
  category: "hackathon",
  skillNames: ["Figma", "Backend Development"],
  templates: [],
};

/** Fake LLM that returns the given answers in order and records what it was sent. */
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

describe("runGuidebookAgent", () => {
  it("returns a draft from valid JSON on the first try", async () => {
    const llm = fakeLlm(JSON.stringify(validExtraction));
    const r = await runGuidebookAgent({ ...base, generate: llm.generate });
    expect(r.status).toBe("draft");
    if (r.status !== "draft") return;
    expect(r.attempts).toBe(1);
    expect(r.pageCount).toBe(2);
    expect(r.data.suggested_roles[0]?.page).toBe(7);
    expect(llm.calls).toHaveLength(1);
  });

  it("sends page-marked text, the category and the skill list", async () => {
    const llm = fakeLlm(JSON.stringify(validExtraction));
    await runGuidebookAgent({ ...base, generate: llm.generate });
    const prompt = llm.calls[0]!.turns[0]!.text;
    expect(prompt).toContain("Competition category: hackathon");
    expect(prompt).toContain("Skill list: Figma, Backend Development");
    expect(prompt).toContain("=== PAGE 2 ===\nKriteria penilaian");
    expect(llm.calls[0]!.system).toContain("Never invent criteria");
  });

  it("retries once with the validation errors, then accepts the fixed answer", async () => {
    const llm = fakeLlm(
      JSON.stringify({ ...validExtraction, summary: 5 }),
      JSON.stringify(validExtraction),
    );
    const r = await runGuidebookAgent({ ...base, generate: llm.generate });
    expect(r.status).toBe("draft");
    if (r.status === "draft") expect(r.attempts).toBe(2);
    const retry = llm.calls[1]!.turns;
    expect(retry.map((t) => t.role)).toEqual(["user", "model", "user"]);
    expect(retry[2]!.text).toContain("- summary:");
  });

  it("fails after two invalid answers, including non-JSON text", async () => {
    const llm = fakeLlm("Maaf, saya tidak bisa.", "{}");
    const r = await runGuidebookAgent({ ...base, generate: llm.generate });
    expect(r).toMatchObject({ status: "failed", error: GUIDEBOOK_ERRORS.invalid });
    expect(llm.calls).toHaveLength(2);
  });

  it("fails a scanned PDF without calling the LLM", async () => {
    const llm = fakeLlm();
    const r = await runGuidebookAgent({
      ...base,
      pdf: makePdf(["1", "2"]),
      generate: llm.generate,
    });
    expect(r).toMatchObject({ status: "failed", error: SCANNED_PDF_MESSAGE, pageCount: 2 });
    expect(llm.calls).toHaveLength(0);
  });

  it("fails a file that is not a PDF", async () => {
    const r = await runGuidebookAgent({
      ...base,
      pdf: new TextEncoder().encode("bukan pdf"),
      generate: fakeLlm().generate,
    });
    expect(r).toMatchObject({
      status: "failed",
      error: GUIDEBOOK_ERRORS.unreadable,
      pageCount: null,
    });
  });

  it("fails with the timeout message when the LLM is too slow", async () => {
    const slow: GenerateJson = ({ signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
    const r = await runGuidebookAgent({ ...base, generate: slow, timeoutMs: 20 });
    expect(r).toMatchObject({ status: "failed", error: GUIDEBOOK_ERRORS.timeout });
  });

  it("fails with a general message when the LLM call errors", async () => {
    const r = await runGuidebookAgent({ ...base, generate: fakeLlm(new Error("503")).generate });
    expect(r).toMatchObject({ status: "failed", error: GUIDEBOOK_ERRORS.failed });
  });

  it("adds the truncation warning for a very long guidebook", async () => {
    const long = makePdf(
      Array.from({ length: 61 }, () => "Halaman isi guidebook yang cukup panjang untuk dibaca."),
    );
    const r = await runGuidebookAgent({
      ...base,
      pdf: long,
      generate: fakeLlm(JSON.stringify({ ...validExtraction, warnings: ["Bobot tidak lengkap"] }))
        .generate,
    });
    expect(r.warnings).toEqual([TRUNCATED_PDF_WARNING, "Bobot tidak lengkap"]);
  });
});
