import { NextResponse } from "next/server";
import { ERROR_MESSAGES, isErrorCode, issuesToFields, type ErrorCode } from "@/lib/action-result";
import { runCaseFeedbackAgent } from "@/lib/ai/case-feedback";
import { getGemini } from "@/lib/ai/gemini";
import { CASE_FEEDBACK_PROMPT_VERSION, type RubricItem } from "@/lib/ai/prompts/case-feedback";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { caseFeedbackSchema } from "@/lib/validation/learn";

export const maxDuration = 60;

const RATE_LIMIT_PER_HOUR = 10;
const MAX_ATTEMPTS = 3;

const STATUS: Partial<Record<ErrorCode, number>> = {
  VALIDATION: 400,
  AUTH_REQUIRED: 401,
  NO_ACCESS: 403,
  NOT_FOUND: 404,
  MAX_ATTEMPTS: 409,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
};

function fail(code: ErrorCode, message: string = ERROR_MESSAGES[code], extra?: object) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status: STATUS[code] ?? 500 });
}

/**
 * POST /api/ai/case-feedback (PRD §13.2, §8.3, F-LRN-04). Grades a case-study answer against the
 * question's rubric and stores it as an attempt (`record_case_attempt`, at most 3).
 * Without the LLM (no key or DEMO_MODE) it answers AI_UNAVAILABLE and stores nothing, so the
 * student keeps all three tries (ADR 0006).
 * Response: `{ attemptNo, feedback, totalScore, maxScore, pointsAwarded, lessonCompleted }`.
 */
export async function POST(req: Request) {
  const parsed = caseFeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("VALIDATION", parsed.error.issues[0]?.message ?? ERROR_MESSAGES.VALIDATION, {
      fields: issuesToFields(parsed.error.issues),
    });
  }
  const { questionId, answer } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return fail("AUTH_REQUIRED");

  const { data: q } = await supabase
    .from("questions_public")
    .select("id, lesson_id, type, prompt_md, rubric")
    .eq("id", questionId)
    .maybeSingle();
  if (!q?.lesson_id || q.type !== "case") return fail("NOT_FOUND");
  const rubric = (Array.isArray(q.rubric) ? q.rubric : []) as unknown as RubricItem[];
  if (rubric.length === 0) return fail("NOT_FOUND");

  const [{ data: open }, { count: used }] = await Promise.all([
    supabase.rpc("lesson_is_open", { p_lesson: q.lesson_id }),
    supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("question_id", questionId),
  ]);
  if (!open) return fail("NO_ACCESS");
  if ((used ?? 0) >= MAX_ATTEMPTS) return fail("MAX_ATTEMPTS");

  const gemini = getGemini();
  if (!gemini) return fail("AI_UNAVAILABLE", "Feedback AI belum aktif. Jawabanmu belum dikirim.");

  const { count } = await supabase
    .from("agent_actions")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", profile.id)
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return fail("RATE_LIMITED");

  const started = Date.now();
  const result = await runCaseFeedbackAgent({
    promptMd: q.prompt_md ?? "",
    rubric,
    answer,
    generate: gemini.generateJson,
  });
  const durationMs = Date.now() - started;

  const log = (output: Json, error: string | null) =>
    supabase.from("agent_actions").insert({
      agent: "case_feedback",
      actor_id: profile.id,
      target_id: questionId,
      input: {
        questionId,
        answerLength: answer.length,
        promptVersion: CASE_FEEDBACK_PROMPT_VERSION,
      },
      output,
      approval: "auto",
      model: gemini.model,
      duration_ms: durationMs,
      error,
    });

  if (result.status === "failed") {
    await log(null, result.error);
    return fail("AI_UNAVAILABLE", result.error);
  }

  const { data: saved, error } = await supabase.rpc("record_case_attempt", {
    p_question: questionId,
    p_text: answer,
    p_feedback: result.feedback as unknown as Json,
    p_score: result.maxScore > 0 ? result.totalScore / result.maxScore : 0,
  });
  await log({ totalScore: result.totalScore, maxScore: result.maxScore }, error?.message ?? null);
  if (error) {
    if (error.code === "P0001" && isErrorCode(error.message)) return fail(error.message);
    console.error("case feedback: record_case_attempt", error);
    return fail("UNKNOWN");
  }

  const s = saved as { attempt_no: number; points_awarded: number; lesson_completed: boolean };
  return NextResponse.json({
    attemptNo: s.attempt_no,
    feedback: result.feedback,
    totalScore: result.totalScore,
    maxScore: result.maxScore,
    pointsAwarded: s.points_awarded,
    lessonCompleted: s.lesson_completed,
  });
}
