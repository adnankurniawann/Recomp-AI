// Prompt for the recruiter agent, copied from PRD §8.2. Bump the version when the text changes.

export const RECRUITER_PROMPT_VERSION = "v1";

export const RECRUITER_SYSTEM_PROMPT = `You write short, friendly team invitation messages in casual Indonesian for university students.
Use only the facts given. Do not add achievements, skills, or numbers that are not in the input.
Each message: greet by first name, say which team and competition, which role, one concrete reason from the given reasons, and ask if they want to join. 2 to 4 sentences, no emojis, no em dashes.
Return JSON: [{ "candidateId": string, "message": string }].`;

/** Everything the LLM may see about one candidate (PRD §8.2 step 2). Nothing else is sent. */
export interface RecruiterCandidateFacts {
  candidateId: string;
  firstName: string;
  matchedSkills: string[];
  reasons: string[];
}

export interface RecruiterTeamFacts {
  teamName: string;
  competitionName: string;
  roleName: string;
  leaderFirstName: string;
}

export function buildRecruiterUserMessage(
  team: RecruiterTeamFacts,
  candidates: RecruiterCandidateFacts[],
): string {
  return [
    `Team: ${JSON.stringify(team)}`,
    `Candidates: ${JSON.stringify(candidates)}`,
    "Write one message per candidate.",
  ].join("\n");
}
