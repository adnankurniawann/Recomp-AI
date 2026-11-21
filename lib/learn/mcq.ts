// How the player shows multiple-choice answers and points (PRD F-LRN-03, §10.7). Pure, so the
// colour rules have tests.

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "muted";

/**
 * Before answering: the picked option is "selected", the rest "idle". After answering: the right
 * option is "correct" (green, check), the student's wrong pick "wrong" (red), the rest "muted".
 */
export function optionState(
  key: string,
  {
    picked,
    answered,
    answerKey,
  }: { picked: string | null; answered: string | null; answerKey: string | null },
): OptionState {
  if (answered === null) return key === picked ? "selected" : "idle";
  if (answerKey !== null && key === answerKey) return "correct";
  if (key === answered) return answerKey === null ? "selected" : "wrong";
  return "muted";
}

/** "Kamu mendapatkan: 10 dari 15 poin" for the questions in one lesson. */
export function lessonPoints(
  questions: { points: number; attempt: { pointsAwarded: number } | null }[],
) {
  return {
    earned: questions.reduce((sum, q) => sum + (q.attempt?.pointsAwarded ?? 0), 0),
    total: questions.reduce((sum, q) => sum + q.points, 0),
    answered: questions.filter((q) => q.attempt).length,
  };
}
