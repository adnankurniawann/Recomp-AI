// Prompt for case-study feedback, copied from PRD §8.3. Bump the version when the text changes.

export const CASE_FEEDBACK_PROMPT_VERSION = "v1";

export const CASE_FEEDBACK_SYSTEM_PROMPT = `You grade a student's answer against a rubric. Be fair and specific.
For each rubric criterion, give a score, quote the part of the answer you are judging (or null if missing), explain briefly, and give one concrete improvement.
Never rewrite the full answer for the student. Write comments in Indonesian. Return JSON only.`;

export interface RubricItem {
  criterion: string;
  description: string;
  max_score: number;
}

export function buildCaseFeedbackUserMessage(input: {
  promptMd: string;
  rubric: RubricItem[];
  answer: string;
}): string {
  return [
    "Question:",
    input.promptMd,
    "",
    `Rubric (use these criterion names exactly, one score per criterion, 0 to max_score): ${JSON.stringify(input.rubric)}`,
    "",
    "Student answer:",
    input.answer,
  ].join("\n");
}
