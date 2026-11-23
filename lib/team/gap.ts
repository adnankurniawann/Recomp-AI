// Filled roles and the skill gap of a team (PRD F-TEM-04, CONTEXT.md "Slot" and "Gap").

export interface GapRole {
  slots: number;
  memberCount: number;
  requiredSkillIds: number[];
}

/** A role is filled when its members equal its slots. */
export function isRoleFilled(role: Pick<GapRole, "slots" | "memberCount">): boolean {
  return role.memberCount >= role.slots;
}

/** Required skills of the roles that are not filled yet, each once, in role order. */
export function skillGap(roles: GapRole[]): number[] {
  const ids = roles.filter((r) => !isRoleFilled(r)).flatMap((r) => r.requiredSkillIds);
  return [...new Set(ids)];
}
