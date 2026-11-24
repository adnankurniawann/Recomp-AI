import type { ChatTurn, GenerateJson } from "./guidebook";
import { buildRepairMessage } from "./prompts/guidebook";
import {
  CASE_FEEDBACK_SYSTEM_PROMPT,
  buildCaseFeedbackUserMessage,
  type RubricItem,
} from "./prompts/case-feedback";
import { CASE_FEEDBACK_JSON_SCHEMA, CaseFeedback, describeIssues } from "./schemas";

export const CASE_FEEDBACK_TIMEOUT_MS = 45_000;

export const CASE_FEEDBACK_ERRORS = {
  invalid: "Feedback AI belum bisa dibuat untuk jawaban ini. Coba kirim lagi sebentar lagi.",
  timeout: "AI terlalu lama menilai jawabanmu. Coba kirim lagi sebentar lagi.",
  failed: "AI gagal menilai jawabanmu. Coba kirim lagi sebentar lagi.",
} as const;

export type CaseFeedbackResult =
  | { status: "ok"; feedback: CaseFeedback; totalScore: number; maxScore: number }
  | { status: "failed"; error: string };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Lines the model's scores up with the rubric: one per criterion, in rubric order, with the
 * rubric's max_score and the score clamped to 0..max. Returns the criteria the model left out,
 * so the agent can ask again.
 */
export function alignWithRubric(
  feedback: CaseFeedback,
  rubric: RubricItem[],
): { feedback: CaseFeedback; missing: string[] } {
  const byName = new Map(feedback.scores.map((s) => [norm(s.criterion), s]));
  const missing: string[] = [];
  const scores = rubric.flatMap((r) => {
    const s = byName.get(norm(r.criterion));
    if (!s) {
      missing.push(r.criterion);
      return [];
    }
    const score = Math.round(Math.min(Math.max(s.score, 0), r.max_score) * 10) / 10;
    return [{ ...s, criterion: r.criterion, score, max_score: r.max_score }];
  });
  return { feedback: { ...feedback, scores }, missing };
}

/**
 * Grades a case-study answer against its rubric (PRD §8.3, F-LRN-04). One retry when the output
 * doesn't match the schema or skips a criterion. Never throws.
 */
export async function runCaseFeedbackAgent(input: {
  promptMd: string;
  rubric: RubricItem[];
  answer: string;
  generate: GenerateJson;
  timeoutMs?: number;
}): Promise<CaseFeedbackResult> {
  const signal = AbortSignal.timeout(input.timeoutMs ?? CASE_FEEDBACK_TIMEOUT_MS);
  const turns: ChatTurn[] = [{ role: "user", text: buildCaseFeedbackUserMessage(input) }];

  for (const attempt of [1, 2]) {
    let raw: string;
    try {
      raw = await input.generate({
        system: CASE_FEEDBACK_SYSTEM_PROMPT,
        turns,
        jsonSchema: CASE_FEEDBACK_JSON_SCHEMA,
        signal,
      });
    } catch (err) {
      console.error("case feedback: LLM call failed", err);
      return {
        status: "failed",
        error: signal.aborted ? CASE_FEEDBACK_ERRORS.timeout : CASE_FEEDBACK_ERRORS.failed,
      };
    }

    const parsed = CaseFeedback.safeParse(parseJson(raw));
    let issues: string;
    if (parsed.success) {
      const { feedback, missing } = alignWithRubric(parsed.data, input.rubric);
      if (missing.length === 0) {
        const totalScore = feedback.scores.reduce((sum, s) => sum + s.score, 0);
        const maxScore = input.rubric.reduce((sum, r) => sum + r.max_score, 0);
        return { status: "ok", feedback, totalScore, maxScore };
      }
      issues = `- scores: missing criteria ${missing.map((m) => JSON.stringify(m)).join(", ")}`;
    } else {
      issues = describeIssues(parsed.error);
    }
    if (attempt === 2) break;
    turns.push({ role: "model", text: raw }, { role: "user", text: buildRepairMessage(issues) });
  }

  return { status: "failed", error: CASE_FEEDBACK_ERRORS.invalid };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
