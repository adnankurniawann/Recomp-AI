import { describe, expect, it } from "vitest";
import { buildOutline, resumeLesson, type OutlineInput } from "./outline";

const lesson = (id: string, sort: number, isFreePreview: boolean) => ({
  id,
  slug: id,
  title: `Materi ${id}`,
  sort,
  isFreePreview,
});

// Chapters and lessons given out of order on purpose.
const chapters: OutlineInput["chapters"] = [
  {
    id: "c2",
    title: "Dari masalah ke solusi",
    sort: 2,
    lessons: [lesson("b2", 2, false), lesson("b1", 1, false)],
  },
  {
    id: "c1",
    title: "Memahami lomba",
    sort: 1,
    lessons: [lesson("a1", 1, true), lesson("a2", 2, true)],
  },
];

describe("buildOutline", () => {
  it("orders chapters and lessons and locks paid lessons without access", () => {
    const outline = buildOutline({
      chapters,
      doneLessonIds: new Set(["a1"]),
      hasAccess: false,
      currentLessonId: "a2",
    });
    expect(outline.lessons.map((l) => [l.id, l.status])).toEqual([
      ["a1", "done"],
      ["a2", "current"],
      ["b1", "locked"],
      ["b2", "locked"],
    ]);
    expect(outline.chapters.map((c) => c.title)).toEqual([
      "Memahami lomba",
      "Dari masalah ke solusi",
    ]);
  });

  it("opens every lesson once the student has access", () => {
    const outline = buildOutline({
      chapters,
      doneLessonIds: new Set(),
      hasAccess: true,
      currentLessonId: null,
    });
    expect(outline.lessons.every((l) => l.isOpen && l.status === "open")).toBe(true);
  });

  it("gives the previous and next lesson across chapters for the bottom bar", () => {
    const outline = buildOutline({
      chapters,
      doneLessonIds: new Set(),
      hasAccess: true,
      currentLessonId: "a2",
    });
    expect(outline.previous?.id).toBe("a1");
    expect(outline.next?.id).toBe("b1");
    expect(outline.next?.chapterTitle).toBe("Dari masalah ke solusi");
  });

  it("has no previous on the first lesson and no next on the last", () => {
    const first = buildOutline({
      chapters,
      doneLessonIds: new Set(),
      hasAccess: true,
      currentLessonId: "a1",
    });
    const last = buildOutline({
      chapters,
      doneLessonIds: new Set(),
      hasAccess: true,
      currentLessonId: "b2",
    });
    expect(first.previous).toBeNull();
    expect(last.next).toBeNull();
  });
});

describe("resumeLesson", () => {
  it("starts at the first lesson of a new course", () => {
    expect(resumeLesson({ chapters, doneLessonIds: new Set(), hasAccess: false })?.id).toBe("a1");
  });

  it("continues at the first open lesson not done yet", () => {
    expect(resumeLesson({ chapters, doneLessonIds: new Set(["a1"]), hasAccess: true })?.id).toBe(
      "a2",
    );
  });

  it("goes to the first locked lesson once the free chapter is done", () => {
    const done = new Set(["a1", "a2"]);
    expect(resumeLesson({ chapters, doneLessonIds: done, hasAccess: false })?.id).toBe("b1");
  });

  it("goes back to the start when everything is done, and is null without lessons", () => {
    const all = new Set(["a1", "a2", "b1", "b2"]);
    expect(resumeLesson({ chapters, doneLessonIds: all, hasAccess: true })?.id).toBe("a1");
    expect(resumeLesson({ chapters: [], doneLessonIds: all, hasAccess: true })).toBeNull();
  });
});
