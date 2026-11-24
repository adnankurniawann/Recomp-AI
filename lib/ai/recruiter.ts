import { inviteTemplate } from "@/lib/invites/template";
import type { GenerateJson } from "./guidebook";
import {
  RECRUITER_SYSTEM_PROMPT,
  buildRecruiterUserMessage,
  type RecruiterCandidateFacts,
  type RecruiterTeamFacts,
} from "./prompts/recruiter";
import { RECRUITER_JSON_SCHEMA, RecruiterDrafts } from "./schemas";

export const RECRUITER_TIMEOUT_MS = 30_000;
export const DRAFT_MIN = 80;
export const DRAFT_MAX = 500;

/** How many top candidates get a draft (PRD F-RCR-01). */
export const RECRUIT_COUNT = 3;

export interface RecruitCandidate extends RecruiterCandidateFacts {
  fullName: string;
  score: number;
}

export interface RecruitDraft {
  candidateId: string;
  fullName: string;
  score: number;
  message: string;
  /** False when the template was used: AI off, the call failed, or the draft failed the check. */
  aiDrafted: boolean;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The PRD §8.2 check after the LLM: a draft must be 80–500 characters, must not contain a number
 * that isn't in the facts, and must not name a skill from the skill list that isn't in the facts.
 * Returns the cleaned message (em dashes become commas) or null to use the template.
 */
export function checkDraft(
  message: string,
  team: RecruiterTeamFacts,
  cand: RecruiterCandidateFacts,
  allSkillNames: readonly string[],
): string | null {
  const text = message
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < DRAFT_MIN || text.length > DRAFT_MAX) return null;

  const facts = [
    team.teamName,
    team.competitionName,
    team.roleName,
    team.leaderFirstName,
    cand.firstName,
    ...cand.matchedSkills,
    ...cand.reasons,
  ]
    .join(" \n ")
    .toLowerCase();

  for (const n of text.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    if (!facts.includes(n)) return null;
  }
  const lower = text.toLowerCase();
  for (const skill of allSkillNames) {
    const s = skill.toLowerCase();
    if (facts.includes(s)) continue;
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${escape(s)}([^\\p{L}\\p{N}]|$)`, "u").test(lower)) {
      return null;
    }
  }
  return text;
}

export function templateDraft(team: RecruiterTeamFacts, cand: RecruitCandidate): RecruitDraft {
  return {
    candidateId: cand.candidateId,
    fullName: cand.fullName,
    score: cand.score,
    message: inviteTemplate({
      candidateName: cand.fullName,
      leaderName: team.leaderFirstName,
      teamName: team.teamName,
      competitionName: team.competitionName,
      roleName: team.roleName,
      topReason: cand.reasons[0],
    }),
    aiDrafted: false,
  };
}

/**
 * Drafts invite messages for the top candidates (PRD §8.2, F-RCR-01). Each draft that is missing
 * or fails `checkDraft` falls back to the F-INV-01 template, so the leader always gets one draft
 * per candidate. With `generate` null (AI off, ADR 0006) every draft is the template. Never sends
 * anything: that takes the leader's click (ADR 0004).
 */
export async function runRecruiterAgent(input: {
  team: RecruiterTeamFacts;
  candidates: RecruitCandidate[];
  allSkillNames: readonly string[];
  generate: GenerateJson | null;
  timeoutMs?: number;
}): Promise<{ drafts: RecruitDraft[]; error: string | null }> {
  const { team, candidates } = input;
  const fallback = () => candidates.map((c) => templateDraft(team, c));
  if (!input.generate) return { drafts: fallback(), error: null };

  const facts: RecruiterCandidateFacts[] = candidates.map((c) => ({
    candidateId: c.candidateId,
    firstName: c.firstName,
    matchedSkills: c.matchedSkills,
    reasons: c.reasons,
  }));

  let raw: string;
  try {
    raw = await input.generate({
      system: RECRUITER_SYSTEM_PROMPT,
      turns: [{ role: "user", text: buildRecruiterUserMessage(team, facts) }],
      jsonSchema: RECRUITER_JSON_SCHEMA,
      signal: AbortSignal.timeout(input.timeoutMs ?? RECRUITER_TIMEOUT_MS),
    });
  } catch (err) {
    console.error("recruiter agent: LLM call failed", err);
    return { drafts: fallback(), error: "LLM call failed" };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    json = undefined;
  }
  const parsed = RecruiterDrafts.safeParse(json);
  if (!parsed.success) return { drafts: fallback(), error: "invalid JSON" };

  const byId = new Map(parsed.data.map((d) => [d.candidateId, d.message]));
  return {
    drafts: candidates.map((c) => {
      const message = byId.get(c.candidateId);
      const ok = message ? checkDraft(message, team, c, input.allSkillNames) : null;
      return ok
        ? {
            candidateId: c.candidateId,
            fullName: c.fullName,
            score: c.score,
            message: ok,
            aiDrafted: true,
          }
        : templateDraft(team, c);
    }),
    error: null,
  };
}
