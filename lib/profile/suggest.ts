import type { PreferredRoleKey } from "@/lib/constants";

export interface RoleTemplateSkills {
  /** `role_templates.category`; hackathon templates come first because v1 is for hackathons. */
  category: string;
  colorKey: string;
  sort: number;
  /** In template order, from `role_templates.required_skills` (`[{ skill_id, min_level }]`). */
  requiredSkillIds: number[];
  optionalSkillIds: number[];
}

const FIRST_CATEGORY = "hackathon";

/**
 * Skills to suggest for the roles a student picked (PRD F-PRF-01 step 2), most relevant first.
 * For each picked role, in the order picked, walk its templates (hackathon first, then by `sort`)
 * and take each template's required skills, then its optional ones. A skill is listed once.
 * So picking UI/UX puts the hackathon UI/UX template on top: Figma, User Research, Prototyping,
 * Design System.
 */
export function suggestSkillIds(
  templates: readonly RoleTemplateSkills[],
  preferredRoles: readonly PreferredRoleKey[],
): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  const add = (id: number) => {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  };
  const rank = (t: RoleTemplateSkills) => (t.category === FIRST_CATEGORY ? 0 : 1);

  for (const role of preferredRoles) {
    const matching = templates
      .filter((t) => t.colorKey === role)
      .sort((a, b) => rank(a) - rank(b) || a.sort - b.sort);
    for (const t of matching) {
      t.requiredSkillIds.forEach(add);
      t.optionalSkillIds.forEach(add);
    }
  }
  return out;
}

/** Read `role_templates.required_skills` (`[{"skill_id":1,"min_level":2}]`) into skill ids. */
export function requiredSkillIdsFromJson(json: unknown): number[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((item) => {
    const id = (item as { skill_id?: unknown } | null)?.skill_id;
    return typeof id === "number" && Number.isInteger(id) ? [id] : [];
  });
}
