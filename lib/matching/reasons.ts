// One-line reasons from code templates, never an LLM (PRD §7.4, ADR 0002).
import { COMPETITION_CATEGORY_LABELS, LEVEL_LABELS } from "../constants";
import type {
  CandidateInput,
  FactorKey,
  MatchingConfig,
  Reason,
  RoleRequirement,
  SkillNames,
  TeamContext,
} from "./types";

export interface ReasonInput {
  role: RoleRequirement;
  cand: CandidateInput;
  team: TeamContext;
  factors: Record<FactorKey, number>;
  cfg: MatchingConfig;
  skillNames: SkillNames;
}

const times = (n: number) => (n === 1 ? "sekali" : `${n} kali`);

export function buildReasons({ role, cand, team, factors, cfg, skillNames }: ReasonInput): Reason[] {
  const name = (id: number) => skillNames.get(id) ?? `Skill #${id}`;
  const owned = new Map(cand.skills.map((s) => [s.skillId, s]));
  const matched = role.requiredSkills.filter((r) => owned.has(r.skillId));
  const out: { factor: FactorKey; reason: Reason }[] = [];
  const add = (factor: FactorKey, code: string, text: string, icon: Reason["icon"]) =>
    out.push({ factor, reason: { code, text, icon } });

  const matchedNames = matched.map((r) => name(r.skillId)).join(", ");
  if (matched.length === role.requiredSkills.length) {
    add("coverage", "coverage_full", `Menutup semua skill wajib: ${matchedNames}`, "check");
  } else if (matched.length > 0) {
    add(
      "coverage",
      "coverage_partial",
      `Menutup ${matched.length} dari ${role.requiredSkills.length} skill wajib: ${matchedNames}`,
      "check-partial",
    );
  }

  for (const r of matched) {
    const s = owned.get(r.skillId)!;
    if (s.level >= 3 && s.hasEvidence) {
      add("level", "skill_evidence", `${name(r.skillId)} level ${LEVEL_LABELS[s.level].label}, ada bukti portofolio`, "link");
    }
  }

  if (factors.experience >= 0.6) {
    const same = cand.history.filter((h) => h.category === team.competitionCategory);
    const winners = same.filter((h) => h.result.startsWith("winner_")).length;
    const finalists = same.filter((h) => h.result === "finalist").length;
    const honorable = same.filter((h) => h.result === "honorable").length;
    const parts = [
      `Pernah ikut ${same.length} ${COMPETITION_CATEGORY_LABELS[team.competitionCategory]}`,
      winners && `${times(winners)} juara`,
      finalists && `${times(finalists)} finalis`,
      honorable && `${times(honorable)} juara harapan`,
    ].filter(Boolean);
    add("experience", "experience", parts.join(", "), "trophy");
  }

  if (factors.availability < 1) {
    const gap = role.hoursPerWeek - cand.hoursPerWeek;
    add(
      "availability",
      "availability_short",
      `${cand.hoursPerWeek} jam per minggu, ${gap} jam di bawah kebutuhan role`,
      "clock-short",
    );
  } else {
    add(
      "availability",
      "availability_full",
      `Bisa ${cand.hoursPerWeek} jam per minggu, sesuai kebutuhan role`,
      "clock",
    );
  }

  if (cand.preferredRoles.includes(role.colorKey)) {
    add("fit", "preferred_role", `Memang berminat jadi ${role.name}`, "star");
  }

  const sameWorkTime =
    cand.workTime === team.workTime || cand.workTime === "flexible" || team.workTime === "flexible";
  if (cand.goal === team.goal && sameWorkTime) {
    add("fit", "goal_worktime", "Tujuan dan jam kerja sama dengan tim", "people");
  }

  // Strongest factor first: its weighted share of the score. Array.sort is stable, so ties keep template order.
  const strength = (f: FactorKey) => cfg.weights[f] * factors[f];
  return out.sort((a, b) => strength(b.factor) - strength(a.factor)).map((x) => x.reason);
}
