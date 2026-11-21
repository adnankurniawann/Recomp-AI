// The lesson list of a course as the player shows it (PRD F-LRN-02, F-LRN-03): each lesson's status
// and the previous and next lesson for the bottom bar. Pure, so the rules have tests.

export type LessonStatus = "done" | "current" | "open" | "locked";

export interface OutlineInput {
  chapters: {
    id: string;
    title: string;
    sort: number;
    lessons: { id: string; slug: string; title: string; sort: number; isFreePreview: boolean }[];
  }[];
  /** Lessons the student finished (`lesson_progress`). */
  doneLessonIds: ReadonlySet<string>;
  /** The student bought or redeemed the course, or it is free. */
  hasAccess: boolean;
  currentLessonId: string | null;
}

export interface OutlineLesson {
  id: string;
  slug: string;
  title: string;
  chapterTitle: string;
  status: LessonStatus;
  isOpen: boolean;
}

export interface Outline {
  chapters: { id: string; title: string; lessons: OutlineLesson[] }[];
  /** Every lesson in reading order. */
  lessons: OutlineLesson[];
  previous: OutlineLesson | null;
  next: OutlineLesson | null;
}

export function buildOutline(input: OutlineInput): Outline {
  const chapters = [...input.chapters]
    .sort((a, b) => a.sort - b.sort)
    .map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      lessons: [...chapter.lessons]
        .sort((a, b) => a.sort - b.sort)
        .map((lesson): OutlineLesson => {
          const isOpen = lesson.isFreePreview || input.hasAccess;
          const status: LessonStatus =
            lesson.id === input.currentLessonId
              ? "current"
              : input.doneLessonIds.has(lesson.id)
                ? "done"
                : isOpen
                  ? "open"
                  : "locked";
          return {
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            chapterTitle: chapter.title,
            status,
            isOpen,
          };
        }),
    }));

  const lessons = chapters.flatMap((c) => c.lessons);
  const index = lessons.findIndex((l) => l.id === input.currentLessonId);
  return {
    chapters,
    lessons,
    previous: index > 0 ? lessons[index - 1]! : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1]! : null,
  };
}
