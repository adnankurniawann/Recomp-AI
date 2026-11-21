import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buildOutline, type Outline } from "./outline";

// Data for the lesson player /belajar/[kursus]/[materi] (PRD F-LRN-03, §10.7). Locked lesson content
// is held back here, on the server (PRD §12.3); answer keys come only for questions already answered.

export interface PlayerQuestion {
  id: string;
  type: "mcq" | "case";
  promptMd: string;
  options: { key: string; text: string }[];
  rubric: { criterion: string; description: string; max_score: number }[];
  points: number;
  /** The student's answer, once given. For a case study, the latest of up to 3 attempts. */
  attempt: {
    choice: string | null;
    text: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number;
    attemptNo: number;
    aiFeedback: unknown;
  } | null;
  /** Only for multiple-choice questions the student answered. */
  answerKey: string | null;
  explanationMd: string | null;
}

export interface CourseProgress {
  answered: number;
  totalQuestions: number;
  points: number;
  completedLessons: number;
  totalLessons: number;
  hasAccess: boolean;
}

export interface LessonPlayerData {
  course: { id: string; slug: string; title: string; price: number };
  lesson: {
    id: string;
    slug: string;
    title: string;
    isOpen: boolean;
    /** Null when the lesson is locked. */
    contentMd: string | null;
    videoUrl: string | null;
    estMinutes: number | null;
  };
  outline: Outline;
  questions: PlayerQuestion[];
  progress: CourseProgress;
}

/** Null when the course or lesson doesn't exist, or nobody is signed in (the player needs a login). */
export async function loadLessonPlayer(
  courseSlug: string,
  lessonSlug: string,
): Promise<LessonPlayerData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title, price, chapters(id, title, sort, lessons(id, slug, title, sort, is_free_preview, est_minutes, video_url))",
    )
    .eq("slug", courseSlug)
    .maybeSingle();
  if (error) throw new Error(`course: ${error.message}`);
  if (!course) return null;

  const allLessons = course.chapters.flatMap((c) => c.lessons);
  const current = allLessons.find((l) => l.slug === lessonSlug);
  if (!current) return null;

  const [progressRes, doneRes] = await Promise.all([
    supabase.rpc("course_progress", { p_course: course.id }),
    supabase
      .from("lesson_progress")
      .select("lesson_id")
      .in(
        "lesson_id",
        allLessons.map((l) => l.id),
      ),
  ]);
  if (progressRes.error) throw new Error(`progress: ${progressRes.error.message}`);
  if (doneRes.error) throw new Error(`lesson progress: ${doneRes.error.message}`);

  const p = progressRes.data as {
    answered: number;
    total_questions: number;
    points: number;
    completed_lessons: number;
    total_lessons: number;
    has_access: boolean;
  };
  const progress: CourseProgress = {
    answered: p.answered,
    totalQuestions: p.total_questions,
    points: p.points,
    completedLessons: p.completed_lessons,
    totalLessons: p.total_lessons,
    hasAccess: p.has_access,
  };

  const outline = buildOutline({
    chapters: course.chapters.map((c) => ({
      id: c.id,
      title: c.title,
      sort: c.sort,
      lessons: c.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        sort: l.sort,
        isFreePreview: l.is_free_preview,
      })),
    })),
    doneLessonIds: new Set((doneRes.data ?? []).map((r) => r.lesson_id)),
    hasAccess: progress.hasAccess,
    currentLessonId: current.id,
  });
  const isOpen = current.is_free_preview || progress.hasAccess;

  let contentMd: string | null = null;
  let questions: PlayerQuestion[] = [];
  if (isOpen) {
    const [content, qs, keys] = await Promise.all([
      supabase.from("lessons").select("content_md").eq("id", current.id).single(),
      supabase.from("questions_public").select("*").eq("lesson_id", current.id).order("sort"),
      supabase.rpc("answered_question_keys", { p_lesson: current.id }),
    ]);
    if (content.error) throw new Error(`lesson content: ${content.error.message}`);
    if (qs.error) throw new Error(`questions: ${qs.error.message}`);
    if (keys.error) throw new Error(`answer keys: ${keys.error.message}`);
    contentMd = content.data.content_md;

    const questionIds = (qs.data ?? []).flatMap((q) => (q.id ? [q.id] : []));
    const attempts = questionIds.length
      ? await supabase
          .from("attempts")
          .select("question_id, answer, is_correct, points_awarded, attempt_no, ai_feedback")
          .in("question_id", questionIds)
          .order("attempt_no", { ascending: false })
      : { data: [], error: null };
    if (attempts.error) throw new Error(`attempts: ${attempts.error.message}`);

    const latest = new Map<string, NonNullable<typeof attempts.data>[number]>();
    for (const a of attempts.data ?? [])
      if (!latest.has(a.question_id)) latest.set(a.question_id, a);
    const keyById = new Map((keys.data ?? []).map((k) => [k.question_id, k]));

    questions = (qs.data ?? []).flatMap((q) => {
      if (!q.id || !q.type) return [];
      const a = latest.get(q.id);
      const answer = (a?.answer ?? {}) as { choice?: string; text?: string };
      return [
        {
          id: q.id,
          type: q.type,
          promptMd: q.prompt_md ?? "",
          options: (Array.isArray(q.options) ? q.options : []) as PlayerQuestion["options"],
          rubric: (Array.isArray(q.rubric) ? q.rubric : []) as PlayerQuestion["rubric"],
          points: q.points ?? 0,
          attempt: a
            ? {
                choice: answer.choice ?? null,
                text: answer.text ?? null,
                isCorrect: a.is_correct,
                pointsAwarded: a.points_awarded,
                attemptNo: a.attempt_no,
                aiFeedback: a.ai_feedback,
              }
            : null,
          answerKey: keyById.get(q.id)?.answer_key ?? null,
          explanationMd: keyById.get(q.id)?.explanation_md ?? null,
        },
      ];
    });
  }

  return {
    course: { id: course.id, slug: course.slug, title: course.title, price: course.price },
    lesson: {
      id: current.id,
      slug: current.slug,
      title: current.title,
      isOpen,
      contentMd,
      videoUrl: isOpen ? current.video_url : null,
      estMinutes: current.est_minutes,
    },
    outline,
    questions,
    progress,
  };
}
