// Turns the JSON of the `ranking_candidates` SQL function (migration 0012) into one page of
// GET /api/ranking/[teamRoleId] (PRD §13.2). Pure: parse, score with lib/matching, sort, slice.
// Campus, major and entry year are copied to the response for display only; they never reach
// CandidateInput, so the score can't read them (PRD §7.3).
import { z } from "zod";
import { ROLE_KEYS, PREFERRED_ROLE_KEYS } from "@/lib/constants";
import { DEFAULT_MATCHING_CONFIG, rankCandidates } from "@/lib/matching/score";
import type {
  CandidateInput,
  MatchingConfig,
  RoleRequirement,
  TeamContext,
} from "@/lib/matching/types";
import type { RankingPage, RecommendationFeedback } from "./types";

const level = z.literal([1, 2, 3, 4]);
const goal = z.enum(["win", "learn"]);
const workTime = z.enum(["morning", "afternoon", "night", "flexible"]);
const category = z.enum(["hackathon", "it_competition", "ui_ux", "data", "business_case", "paper"]);
const result = z.enum(["participant", "finalist", "winner_1", "winner_2", "winner_3", "honorable"]);
const num = z.coerce.number(); // numeric columns arrive as numbers or strings

const factorWeights = z.object({
  coverage: num,
  level: num,
  availability: num,
  experience: num,
  fit: num,
});

export const RankingSource = z.object({
  role: z.object({
    id: z.string(),
    name: z.string(),
    // Unknown colours fall back to "other" rather than failing the whole ranking.
    color_key: z.enum(ROLE_KEYS).catch("other"),
    required_skills: z.array(z.object({ skill_id: z.number().int(), min_level: level })),
    optional_skill_ids: z.array(z.number().int()),
    hours_per_week: z.number().int().positive(),
  }),
  team: z.object({ goal, work_time: workTime, category }),
  config: z
    .object({
      weights: factorWeights,
      no_evidence_factor: num,
      optional_bonus: num,
      experience_cap: num,
      podium_bonus: num,
    })
    .nullable(),
  skill_names: z.array(z.object({ id: z.number().int(), name: z.string() })),
  candidates: z.array(
    z.object({
      id: z.string(),
      username: z.string(),
      full_name: z.string(),
      avatar_url: z.string().nullable(),
      campus: z.string().nullable(),
      major: z.string().nullable(),
      entry_year: z.number().int().nullable(),
      preferred_roles: z.array(z.enum(PREFERRED_ROLE_KEYS)),
      is_simulated: z.boolean(),
      hours_per_week: z.number().int(),
      goal,
      work_time: workTime,
      updated_at: z.string(),
      skills: z.array(z.object({ skill_id: z.number().int(), level, has_evidence: z.boolean() })),
      history: z.array(z.object({ category, result })),
    }),
  ),
});
export type RankingSource = z.infer<typeof RankingSource>;

export function toMatchingConfig(row: RankingSource["config"]): MatchingConfig {
  if (!row) return DEFAULT_MATCHING_CONFIG;
  return {
    weights: row.weights,
    noEvidenceFactor: row.no_evidence_factor,
    optionalBonus: row.optional_bonus,
    experienceCap: row.experience_cap,
    podiumBonus: row.podium_bonus,
  };
}

export function buildRankingPage(
  source: RankingSource,
  { limit, offset }: { limit: number; offset: number },
  feedback: ReadonlyMap<string, RecommendationFeedback> = new Map(),
): RankingPage {
  const cfg = toMatchingConfig(source.config);
  const skillNames = new Map(source.skill_names.map((s) => [s.id, s.name]));
  const name = (id: number) => skillNames.get(id) ?? `Skill #${id}`;

  const role: RoleRequirement = {
    id: source.role.id,
    name: source.role.name,
    colorKey: source.role.color_key,
    requiredSkills: source.role.required_skills.map((r) => ({
      skillId: r.skill_id,
      minLevel: r.min_level,
    })),
    optionalSkillIds: source.role.optional_skill_ids,
    hoursPerWeek: source.role.hours_per_week,
  };
  const team: TeamContext = {
    competitionCategory: source.team.category,
    goal: source.team.goal,
    workTime: source.team.work_time,
  };

  const byId = new Map(source.candidates.map((c) => [c.id, c]));
  const inputs: CandidateInput[] = source.candidates.map((c) => ({
    profileId: c.id,
    preferredRoles: c.preferred_roles,
    skills: c.skills.map((s) => ({
      skillId: s.skill_id,
      level: s.level,
      hasEvidence: s.has_evidence,
    })),
    hoursPerWeek: c.hours_per_week,
    goal: c.goal,
    workTime: c.work_time,
    history: c.history,
    updatedAt: c.updated_at,
  }));

  const ranked = rankCandidates(role, inputs, team, cfg, skillNames);
  const minLevel = new Map(role.requiredSkills.map((r) => [r.skillId, r.minLevel]));

  return {
    role: {
      id: role.id,
      name: role.name,
      colorKey: role.colorKey,
      requiredSkills: role.requiredSkills.map((r) => ({ ...r, name: name(r.skillId) })),
      hoursPerWeek: role.hoursPerWeek,
    },
    total: ranked.length,
    candidates: ranked.slice(offset, offset + limit).map((r) => {
      const c = byId.get(r.profileId)!;
      const owned = new Map(c.skills.map((s) => [s.skill_id, s]));
      return {
        profile: {
          id: c.id,
          username: c.username,
          fullName: c.full_name,
          avatarUrl: c.avatar_url,
          campus: c.campus,
          major: c.major,
          entryYear: c.entry_year,
          preferredRoles: c.preferred_roles,
          isSimulated: c.is_simulated,
        },
        score: r.score,
        factors: r.factors,
        weights: cfg.weights,
        matchedRequired: r.matchedRequired.map((id) => ({
          skillId: id,
          name: name(id),
          level: owned.get(id)!.level,
          hasEvidence: owned.get(id)!.has_evidence,
        })),
        missingRequired: r.missingRequired.map((id) => ({
          skillId: id,
          name: name(id),
          minLevel: minLevel.get(id)!,
        })),
        reasons: r.reasons,
        // Filter 5 drops anyone with a pending or declined invite from this team, so a listed
        // candidate never has one yet. The UI flips this to "pending" after "Undang".
        inviteStatus: null,
        feedback: feedback.get(c.id) ?? null,
      };
    }),
  };
}
