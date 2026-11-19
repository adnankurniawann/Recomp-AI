// Candidate score as pure functions (PRD §7.3, §7.5, ADR 0002). Filters 1–6 of PRD §7.2 run in
// SQL (`ranking_candidates`); filter 7 and the score run here.
import { buildReasons } from "./reasons";
import type {
  CandidateInput,
  MatchingConfig,
  RoleRequirement,
  ScoreResult,
  SkillNames,
  TeamContext,
} from "./types";

// Same values as the matching_config column defaults (PRD §12.2). Production reads the active row.
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: { coverage: 0.4, level: 0.2, availability: 0.2, experience: 0.1, fit: 0.1 },
  noEvidenceFactor: 0.85,
  optionalBonus: 0.1,
  experienceCap: 3,
  podiumBonus: 0.2,
};

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function scoreCandidate(
  role: RoleRequirement,
  cand: CandidateInput,
  team: TeamContext,
  cfg: MatchingConfig,
  skillNames: SkillNames,
): ScoreResult | null {
  const owned = new Map(cand.skills.map((s) => [s.skillId, s]));
  const req = role.requiredSkills;
  const matched = req.filter((r) => owned.has(r.skillId));
  if (matched.length === 0) return null; // filter 7.2 #7

  const optOwned = role.optionalSkillIds.filter((id) => owned.has(id)).length;
  const optBonus = role.optionalSkillIds.length
    ? cfg.optionalBonus * (optOwned / role.optionalSkillIds.length)
    : 0;
  const coverage = Math.min(matched.length / req.length + optBonus, 1);

  const level = avg(
    matched.map((r) => {
      const s = owned.get(r.skillId)!;
      return Math.min(s.level / r.minLevel, 1) * (s.hasEvidence ? 1 : cfg.noEvidenceFactor);
    }),
  );

  const availability = Math.min(cand.hoursPerWeek / role.hoursPerWeek, 1);

  const sameCat = cand.history.filter((h) => h.category === team.competitionCategory);
  const podium = sameCat.some((h) => h.result !== "participant");
  const experience = Math.min(
    sameCat.length / cfg.experienceCap + (podium ? cfg.podiumBonus : 0),
    1,
  );

  const sameWorkTime =
    cand.workTime === team.workTime || cand.workTime === "flexible" || team.workTime === "flexible";
  const fit =
    (cand.preferredRoles.includes(role.colorKey) ? 0.4 : 0) +
    (cand.goal === team.goal ? 0.3 : 0) +
    (sameWorkTime ? 0.3 : 0);

  const factors = { coverage, level, availability, experience, fit };
  const w = cfg.weights;
  const raw =
    w.coverage * coverage +
    w.level * level +
    w.availability * availability +
    w.experience * experience +
    w.fit * fit;

  return {
    profileId: cand.profileId,
    score: Math.round(raw * 100),
    factors,
    matchedRequired: matched.map((m) => m.skillId),
    missingRequired: req.filter((r) => !owned.has(r.skillId)).map((r) => r.skillId),
    reasons: buildReasons({ role, cand, team, factors, cfg, skillNames }),
  };
}

// Highest score first; ties go to more required skills with evidence, then the newest profile.
export function rankCandidates(
  role: RoleRequirement,
  candidates: CandidateInput[],
  team: TeamContext,
  cfg: MatchingConfig,
  skillNames: SkillNames,
): ScoreResult[] {
  const requiredIds = new Set(role.requiredSkills.map((r) => r.skillId));
  return candidates
    .flatMap((cand) => {
      const result = scoreCandidate(role, cand, team, cfg, skillNames);
      if (!result) return [];
      const evidence = cand.skills.filter((s) => s.hasEvidence && requiredIds.has(s.skillId)).length;
      return [{ result, evidence, updatedAt: Date.parse(cand.updatedAt) }];
    })
    .sort(
      (a, b) =>
        b.result.score - a.result.score || b.evidence - a.evidence || b.updatedAt - a.updatedAt,
    )
    .map((x) => x.result);
}
