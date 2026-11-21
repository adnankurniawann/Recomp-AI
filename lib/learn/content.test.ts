import { describe, expect, it } from "vitest";
import { buildCourseRows, courseManifestSchema, parseLessonFile, stableUuid } from "./content";

const lesson = (slug: string, questions = "") => `---
title: Materi ${slug}
slug: ${slug}
minutes: 8
${questions}
---

# Judul

Isi materi.
`;

const mcq = `questions:
  - type: mcq
    prompt: Apa fungsi kriteria penilaian?
    options:
      A: Menentukan bobot nilai
      B: Menentukan hadiah
    answer: A
    explanation: Kriteria menentukan bobot nilai.
  - type: case
    prompt: Tulis problem statement.
    rubric:
      - criterion: Kejelasan
        description: Masalahnya jelas
        max_score: 5`;

const manifest = courseManifestSchema.parse({
  slug: "persiapan-hackathon",
  title: "Persiapan Hackathon",
  description: "Kursus singkat untuk tim hackathon.",
  category: "hackathon",
  price: 49000,
  chapters: [
    { title: "Memahami lomba", free: true, lessons: ["a.md", "b.md"] },
    { title: "Dari masalah ke solusi", lessons: ["c.md"] },
  ],
});

describe("parseLessonFile", () => {
  it("reads the frontmatter, the questions and the body", () => {
    const parsed = parseLessonFile(lesson("membaca-guidebook", mcq), "a.md");
    expect(parsed.frontmatter.title).toBe("Materi membaca-guidebook");
    expect(parsed.frontmatter.questions).toHaveLength(2);
    expect(parsed.frontmatter.questions[0]).toMatchObject({ type: "mcq", points: 5, answer: "A" });
    expect(parsed.frontmatter.questions[1]).toMatchObject({ type: "case", points: 10 });
    expect(parsed.body.startsWith("# Judul")).toBe(true);
  });

  it("accepts Windows line endings", () => {
    const crlf = lesson("crlf").replace(/\n/g, "\r\n");
    expect(parseLessonFile(crlf, "crlf.md").frontmatter.slug).toBe("crlf");
  });

  it("names the file when something is wrong", () => {
    expect(() => parseLessonFile("no frontmatter", "x.md")).toThrow("x.md: missing");
    const badAnswer = mcq.replace("answer: A", "answer: C");
    expect(() => parseLessonFile(lesson("salah", badAnswer), "y.md")).toThrow(
      /y\.md: .*answer must be one of the options/,
    );
    expect(() => parseLessonFile(lesson("Bad Slug"), "z.md")).toThrow("z.md: slug");
    expect(() => parseLessonFile("---\ntitle: Kosong\nslug: kosong\n---\n", "e.md")).toThrow(
      "no content",
    );
  });
});

describe("stableUuid", () => {
  it("is a valid v5-shaped UUID and the same for the same name", () => {
    const id = stableUuid("course:persiapan-hackathon");
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(stableUuid("course:persiapan-hackathon")).toBe(id);
    expect(stableUuid("course:lain")).not.toBe(id);
  });
});

describe("buildCourseRows", () => {
  const files = new Map([
    ["a.md", parseLessonFile(lesson("a", mcq), "a.md")],
    ["b.md", parseLessonFile(lesson("b"), "b.md")],
    ["c.md", parseLessonFile(lesson("c"), "c.md")],
  ]);

  it("makes the first chapter free and keeps the order", () => {
    const rows = buildCourseRows(manifest, files);
    expect(rows.chapters.map((c) => c.sort)).toEqual([1, 2]);
    expect(rows.lessons.map((l) => [l.slug, l.sort, l.is_free_preview])).toEqual([
      ["a", 1, true],
      ["b", 2, true],
      ["c", 1, false],
    ]);
    expect(rows.course.est_minutes).toBe(24);
  });

  it("stores options as a list and the answer key apart", () => {
    const [q1, q2] = buildCourseRows(manifest, files).questions;
    expect(q1).toMatchObject({
      type: "mcq",
      options: [
        { key: "A", text: "Menentukan bobot nilai" },
        { key: "B", text: "Menentukan hadiah" },
      ],
      answer_key: "A",
      rubric: null,
    });
    expect(q2).toMatchObject({ type: "case", options: null, answer_key: null, points: 10 });
  });

  it("gives the same ids on every run", () => {
    expect(buildCourseRows(manifest, files)).toEqual(buildCourseRows(manifest, files));
  });

  it("fails on a missing file or a repeated slug", () => {
    expect(() => buildCourseRows(manifest, new Map([["a.md", files.get("a.md")!]]))).toThrow(
      "b.md",
    );
    const dup = new Map([...files, ["c.md", files.get("a.md")!]]);
    expect(() => buildCourseRows(manifest, dup)).toThrow('slug "a" is used twice');
  });
});
