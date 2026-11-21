import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { COMP_CATEGORIES } from "@/lib/constants";
import { httpsUrl } from "@/lib/validation/common";

// Course content written as files (PRD F-LRN-06, §15): content/courses/<slug>/course.json lists the
// chapters and the order of their lesson files; each lesson is Markdown with YAML frontmatter that
// holds its questions. scripts/seed-content.ts turns them into database rows with this module.

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

const mcqSchema = z
  .object({
    type: z.literal("mcq"),
    prompt: z.string().min(5),
    points: z.number().int().min(1).max(50).default(5),
    options: z.partialRecord(z.enum(OPTION_KEYS), z.string().min(1)),
    answer: z.enum(OPTION_KEYS),
    explanation: z.string().optional(),
  })
  .refine((q) => Object.keys(q.options).length >= 2, "A question needs at least 2 options")
  .refine((q) => q.answer in q.options, "The answer must be one of the options");

const caseSchema = z.object({
  type: z.literal("case"),
  prompt: z.string().min(5),
  points: z.number().int().min(1).max(50).default(10),
  rubric: z
    .array(
      z.object({
        criterion: z.string().min(2),
        description: z.string().min(2),
        max_score: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export const lessonFrontmatterSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug: lowercase words joined by -"),
  minutes: z.number().int().positive().optional(),
  video: httpsUrl.optional(),
  questions: z.array(z.discriminatedUnion("type", [mcqSchema, caseSchema])).default([]),
});
export type LessonFrontmatter = z.output<typeof lessonFrontmatterSchema>;

export const courseManifestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(3),
  subtitle: z.string().optional(),
  description: z.string().min(10),
  category: z.enum(COMP_CATEGORIES),
  level: z.string().default("Pemula"),
  price: z.number().int().min(0),
  chapters: z
    .array(
      z.object({
        title: z.string().min(3),
        /** Lessons in this chapter are free previews (F-LRN-05: the first chapter is free). */
        free: z.boolean().default(false),
        lessons: z.array(z.string().regex(/\.md$/, "a lesson file ends in .md")).min(1),
      }),
    )
    .min(1),
});
export type CourseManifest = z.output<typeof courseManifestSchema>;

export interface LessonFile {
  frontmatter: LessonFrontmatter;
  body: string;
}

/** Split `---\nyaml\n---\nmarkdown` and validate the frontmatter. Throws with the file name. */
export function parseLessonFile(text: string, fileName: string): LessonFile {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${fileName}: missing --- frontmatter ---`);
  const parsed = lessonFrontmatterSchema.safeParse(parseYaml(match[1]!));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`${fileName}: ${issues}`);
  }
  const body = match[2]!.trim();
  if (body.length === 0) throw new Error(`${fileName}: the lesson has no content`);
  return { frontmatter: parsed.data, body };
}

/**
 * A UUID that is always the same for the same name, so re-seeding updates rows in place and keeps
 * students' attempts and progress (UUID v5 layout over SHA-1).
 */
export function stableUuid(name: string): string {
  const hex = createHash("sha1").update(`recomp-ai:${name}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export interface CourseRows {
  course: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    category: CourseManifest["category"];
    level: string;
    est_minutes: number;
    price: number;
    is_published: boolean;
  };
  chapters: { id: string; course_id: string; title: string; sort: number }[];
  lessons: {
    id: string;
    chapter_id: string;
    slug: string;
    title: string;
    content_md: string;
    video_url: string | null;
    est_minutes: number | null;
    is_free_preview: boolean;
    sort: number;
  }[];
  questions: {
    id: string;
    lesson_id: string;
    type: "mcq" | "case";
    prompt_md: string;
    options: { key: string; text: string }[] | null;
    answer_key: string | null;
    explanation_md: string | null;
    rubric: { criterion: string; description: string; max_score: number }[] | null;
    points: number;
    sort: number;
  }[];
}

/** Turn a manifest and its lesson files into rows with stable ids. Lesson slugs must be unique. */
export function buildCourseRows(
  manifest: CourseManifest,
  lessonFiles: ReadonlyMap<string, LessonFile>,
): CourseRows {
  const courseId = stableUuid(`course:${manifest.slug}`);
  const seenSlugs = new Set<string>();
  const rows: CourseRows = {
    course: {
      id: courseId,
      slug: manifest.slug,
      title: manifest.title,
      subtitle: manifest.subtitle ?? null,
      description: manifest.description,
      category: manifest.category,
      level: manifest.level,
      est_minutes: 0,
      price: manifest.price,
      is_published: true,
    },
    chapters: [],
    lessons: [],
    questions: [],
  };

  manifest.chapters.forEach((chapter, ci) => {
    const chapterId = stableUuid(`chapter:${manifest.slug}:${ci + 1}`);
    rows.chapters.push({ id: chapterId, course_id: courseId, title: chapter.title, sort: ci + 1 });

    chapter.lessons.forEach((file, li) => {
      const lesson = lessonFiles.get(file);
      if (!lesson)
        throw new Error(`${manifest.slug}: course.json lists ${file}, which doesn't exist`);
      const { frontmatter: fm, body } = lesson;
      if (seenSlugs.has(fm.slug))
        throw new Error(`${file}: lesson slug "${fm.slug}" is used twice`);
      seenSlugs.add(fm.slug);

      const lessonId = stableUuid(`lesson:${manifest.slug}:${fm.slug}`);
      rows.lessons.push({
        id: lessonId,
        chapter_id: chapterId,
        slug: fm.slug,
        title: fm.title,
        content_md: body,
        video_url: fm.video ?? null,
        est_minutes: fm.minutes ?? null,
        is_free_preview: chapter.free,
        sort: li + 1,
      });
      rows.course.est_minutes += fm.minutes ?? 0;

      fm.questions.forEach((q, qi) => {
        const base = {
          id: stableUuid(`question:${manifest.slug}:${fm.slug}:${qi + 1}`),
          lesson_id: lessonId,
          prompt_md: q.prompt,
          points: q.points,
          sort: qi + 1,
        };
        rows.questions.push(
          q.type === "mcq"
            ? {
                ...base,
                type: "mcq",
                options: OPTION_KEYS.flatMap((key) =>
                  q.options[key] ? [{ key, text: q.options[key] }] : [],
                ),
                answer_key: q.answer,
                explanation_md: q.explanation ?? null,
                rubric: null,
              }
            : {
                ...base,
                type: "case",
                options: null,
                answer_key: null,
                explanation_md: null,
                rubric: q.rubric,
              },
        );
      });
    });
  });

  return rows;
}
