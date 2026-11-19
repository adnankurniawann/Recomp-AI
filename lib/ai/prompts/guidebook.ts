// Prompts for the guidebook agent, copied from PRD §8.1. Bump the version when the text changes,
// so each extraction records which prompt produced it.

export const GUIDEBOOK_PROMPT_VERSION = "v1";

export const GUIDEBOOK_SYSTEM_PROMPT = `You read Indonesian or English student competition guidebooks and return structured JSON.

Rules:
1. Use only information in the guidebook text. Never invent criteria, weights, dates, or roles.
2. Every criterion, deadline, and role must include the page number where you found the evidence. The text marks pages as "=== PAGE n ===". If you cannot point to a page, set page to null.
3. Role names must be short and common, such as "Backend Developer", "UI/UX Designer", "Data/AI Engineer", "Product and Pitching".
4. Suggest roles in this order of evidence:
   a. "guidebook": the guidebook names roles or team composition directly.
   b. "criteria": derive a role from a judging criterion that needs a distinct skill.
   c. "template": only if a and b give nothing; copy from the provided template list.
5. The total number of role slots must not exceed the maximum team size.
6. For skills, use names from the provided skill list whenever possible. Use min_level 1 to 4 (1 basic, 2 intermediate, 3 advanced, 4 expert).
7. Write "summary" and every "reason" in Indonesian, in plain language, at most 2 sentences.
8. Return JSON only, matching the schema.`;

export interface PromptTemplate {
  name: string;
  required_skills: { skill: string; min_level: number }[];
  optional_skills: string[];
  hours_per_week: number;
  slots: number;
}

export function buildGuidebookUserMessage(input: {
  category: string;
  skillNames: string[];
  templates: PromptTemplate[];
  markedText: string;
}): string {
  return [
    `Competition category: ${input.category}`,
    `Skill list: ${input.skillNames.join(", ")}`,
    `Role templates for this category: ${JSON.stringify(input.templates)}`,
    "",
    "Guidebook text:",
    input.markedText,
  ].join("\n");
}

export function buildRepairMessage(issues: string): string {
  return `Your previous answer did not match the schema:\n${issues}\n\nReturn the full corrected JSON only.`;
}
