import "server-only";
import type { CompCategory } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";
import { buildOutline, resumeLesson, type Outline, type OutlineLesson } from "./outline";

// Data for the course catalog /belajar and the course page /belajar/[kursus] (PRD F-LRN-01..02).
// Both are public: a visitor sees the courses; a signed-in student also sees their own progress
// (lesson_progress, readable by its owner only).

export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: CompCategory;
  level: string;
  estMinutes: number;
  price: number;
  coverUrl: string | null;
  lessonCount: number;
  /** Null when signed out. */
  doneCount: number | null;
}

const LESSON_TREE =
  "chapters(id, title, sort, lessons(id, slug, title, sort, is_free_preview, est_minutes))";

async function viewerAndDone(lessonIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || lessonIds.length === 0)
    return { supabase, signedIn: !!user, done: new Set<string>() };

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .in("lesson_id", lessonIds);
  if (error) throw new Error(`lesson progress: ${error.message}`);
  return { supabase, signedIn: true, done: new Set((data ?? []).map((r) => r.lesson_id)) };
}

export async function loadCourseCatalog(): Promise<CourseCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, slug, title, subtitle, category, level, est_minutes, price, cover_path, ${LESSON_TREE}`,
    )
    .eq("is_published", true)
    .order("created_at");
  if (error) throw new Error(`courses: ${error.message}`);
  const courses = data ?? [];

  const lessonIds = courses.flatMap((c) => c.chapters.flatMap((ch) => ch.lessons.map((l) => l.id)));
  const { signedIn, done } = await viewerAndDone(lessonIds);

  return courses.map((c) => {
    const lessons = c.chapters.flatMap((ch) => ch.lessons);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      level: c.level,
      estMinutes: c.est_minutes ?? 0,
      price: c.price,
      coverUrl: publicStorageUrl("posters", c.cover_path),
      lessonCount: lessons.length,
      doneCount: signedIn ? lessons.filter((l) => done.has(l.id)).length : null,
    };
  });
}

export interface CourseDetail extends Omit<CourseCard, "doneCount"> {
  description: string | null;
  outline: Outline;
  /** Minutes per lesson id, for the chapter list. */
  lessonMinutes: Record<string, number | null>;
  /** Where "Mulai belajar" or "Lanjutkan" leads. */
  resume: OutlineLesson | null;
  signedIn: boolean;
  hasAccess: boolean;
  doneCount: number;
  points: number;
}

export async function loadCourseDetail(slug: string): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const { data: c, error } = await supabase
    .from("courses")
    .select(
      `id, slug, title, subtitle, description, category, level, est_minutes, price, cover_path, ${LESSON_TREE}`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`course: ${error.message}`);
  if (!c) return null;

  const lessons = c.chapters.flatMap((ch) => ch.lessons);
  const { signedIn, done } = await viewerAndDone(lessons.map((l) => l.id));

  let hasAccess = c.price === 0;
  let points = 0;
  if (signedIn) {
    const { data: p, error: pErr } = await supabase.rpc("course_progress", { p_course: c.id });
    if (pErr) throw new Error(`progress: ${pErr.message}`);
    const progress = p as { has_access: boolean; points: number };
    hasAccess = progress.has_access;
    points = progress.points;
  }

  const chapters = c.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    sort: ch.sort,
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      sort: l.sort,
      isFreePreview: l.is_free_preview,
    })),
  }));
  const resume = resumeLesson({ chapters, doneLessonIds: done, hasAccess });
  // "Sedang" marks the lesson the student would continue with, once they have started.
  const started = done.size > 0;
  const outline = buildOutline({
    chapters,
    doneLessonIds: done,
    hasAccess,
    currentLessonId: started && resume && !done.has(resume.id) ? resume.id : null,
  });

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    category: c.category,
    level: c.level,
    estMinutes: c.est_minutes ?? 0,
    price: c.price,
    coverUrl: publicStorageUrl("posters", c.cover_path),
    lessonCount: lessons.length,
    outline,
    lessonMinutes: Object.fromEntries(lessons.map((l) => [l.id, l.est_minutes])),
    resume,
    signedIn,
    hasAccess,
    doneCount: done.size,
    points,
  };
}
