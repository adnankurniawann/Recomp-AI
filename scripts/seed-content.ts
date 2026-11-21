/**
 * Loads the courses in content/courses into Supabase (PRD F-LRN-06, §15), plus the PENGGUNAAWAL promo.
 *
 *   pnpm seed:content
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or .env.local.
 * Rows get stable ids from their slugs, so running it again updates the content in place and keeps
 * students' answers and progress. Lessons or questions removed from the files are deleted.
 * Uses the service role key, so it is a local script only and never runs for a user (ADR 0003).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  buildCourseRows,
  courseManifestSchema,
  parseLessonFile,
  type CourseRows,
  type LessonFile,
} from "@/lib/learn/content";
import type { Database } from "@/lib/supabase/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
}

const db = createClient<Database>(url, key, { auth: { persistSession: false } });
const ROOT = join("content", "courses");

/** PRD F-LRN-05 [USULAN]: free access for the first 100 students, on every course. */
const PROMO = { code: "PENGGUNAAWAL", course_id: null, discount_percent: 100, quota: 100 };

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

function readCourse(dir: string): CourseRows {
  const manifestPath = join(dir, "course.json");
  const manifest = courseManifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
  const files = new Map<string, LessonFile>();
  for (const name of manifest.chapters.flatMap((c) => c.lessons)) {
    const path = join(dir, name);
    if (!existsSync(path)) throw new Error(`${manifestPath} lists ${name}, which doesn't exist`);
    files.set(name, parseLessonFile(readFileSync(path, "utf8"), path));
  }
  return buildCourseRows(manifest, files);
}

/** Delete this course's rows that are no longer in the files. */
async function prune(
  table: "chapters" | "lessons" | "questions",
  parentColumn: "course_id" | "chapter_id" | "lesson_id",
  parentIds: string[],
  keepIds: string[],
) {
  if (parentIds.length === 0) return;
  let query = db.from(table).delete().in(parentColumn, parentIds);
  if (keepIds.length) query = query.not("id", "in", `(${keepIds.join(",")})`);
  check(await query, `prune ${table}`);
}

async function seed(rows: CourseRows) {
  check(await db.from("courses").upsert(rows.course, { onConflict: "slug" }), "upsert course");
  check(await db.from("chapters").upsert(rows.chapters), "upsert chapters");
  check(await db.from("lessons").upsert(rows.lessons), "upsert lessons");
  if (rows.questions.length)
    check(await db.from("questions").upsert(rows.questions), "upsert questions");

  await prune(
    "questions",
    "lesson_id",
    rows.lessons.map((l) => l.id),
    rows.questions.map((q) => q.id),
  );
  await prune(
    "lessons",
    "chapter_id",
    rows.chapters.map((c) => c.id),
    rows.lessons.map((l) => l.id),
  );
  await prune(
    "chapters",
    "course_id",
    [rows.course.id],
    rows.chapters.map((c) => c.id),
  );

  const mcq = rows.questions.filter((q) => q.type === "mcq").length;
  console.log(
    `${rows.course.slug}: ${rows.chapters.length} chapters, ${rows.lessons.length} lessons, ` +
      `${mcq} multiple-choice and ${rows.questions.length - mcq} case-study questions`,
  );
}

async function main() {
  const dirs = readdirSync(ROOT)
    .map((name) => join(ROOT, name))
    .filter((dir) => statSync(dir).isDirectory() && existsSync(join(dir, "course.json")));
  if (dirs.length === 0) throw new Error(`No course.json found under ${ROOT}`);

  // Read and validate everything before writing anything.
  const courses = dirs.map(readCourse);
  for (const rows of courses) await seed(rows);

  // Keep `used` when the promo already exists.
  check(
    await db.from("promo_codes").upsert(PROMO, { onConflict: "code", ignoreDuplicates: true }),
    "promo",
  );
  console.log(`promo ${PROMO.code}: ready`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
