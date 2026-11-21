"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  courseIdSchema,
  lessonIdSchema,
  redeemPromoSchema,
  submitMcqSchema,
} from "@/lib/validation/learn";

// Learning actions (PRD §13.1, F-LRN-03, F-LRN-05). The rules live in the SQL functions of
// migration 0005; these validate input, call them as the signed-in student and map the error.

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function logged<T>(error: { code?: string; message: string }): ActionResult<T> {
  if (error.code !== "P0001") console.error("[learn]", error.code, error.message);
  return failFromDb(error);
}

export interface McqResult {
  isCorrect: boolean;
  answerKey: string;
  explanation: string | null;
  points: number;
  lessonCompleted: boolean;
}

/** Answer a multiple-choice question once. The key and explanation come back only now (F-LRN-03). */
export async function submitMcq(
  questionId: string,
  choice: string,
): Promise<ActionResult<McqResult>> {
  const parsed = submitMcqSchema.safeParse({ questionId, choice });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("submit_mcq", {
    p_question: parsed.data.questionId,
    p_choice: parsed.data.choice,
  });
  if (error) return logged(error);

  const r = data as {
    is_correct: boolean;
    answer_key: string;
    explanation_md: string | null;
    points_awarded: number;
    lesson_completed: boolean;
  };
  revalidatePath("/belajar", "layout");
  return ok({
    isCorrect: r.is_correct,
    answerKey: r.answer_key,
    explanation: r.explanation_md,
    points: r.points_awarded,
    lessonCompleted: r.lesson_completed,
  });
}

/** A lesson without questions is done once the student scrolled to its end (F-LRN-03). */
export async function markLessonRead(
  lessonId: string,
): Promise<ActionResult<Record<string, never>>> {
  const parsed = lessonIdSchema.safeParse({ lessonId });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const { error } = await supabase.rpc("complete_reading_lesson", {
    p_lesson: parsed.data.lessonId,
  });
  if (error) return logged(error);
  revalidatePath("/belajar", "layout");
  return ok({});
}

/** Open a course with a promo code such as PENGGUNAAWAL (F-LRN-05). */
export async function redeemPromo(
  courseId: string,
  code: string,
): Promise<ActionResult<{ access: true }>> {
  const parsed = redeemPromoSchema.safeParse({ courseId, code });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const { error } = await supabase.rpc("redeem_promo", {
    p_code: parsed.data.code,
    p_course: parsed.data.courseId,
  });
  if (error) return logged(error);
  revalidatePath("/belajar", "layout");
  return ok({ access: true });
}

/** "Bayar (Simulasi)": opens the course without moving any money (F-LRN-05, ADR 0005). */
export async function simulatePurchase(courseId: string): Promise<ActionResult<{ access: true }>> {
  const parsed = courseIdSchema.safeParse({ courseId });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const { error } = await supabase.rpc("simulate_course_purchase", {
    p_course: parsed.data.courseId,
  });
  if (error) return logged(error);
  revalidatePath("/belajar", "layout");
  return ok({ access: true });
}
