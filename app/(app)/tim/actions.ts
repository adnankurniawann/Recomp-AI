"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { createTeamSchema, type CreateTeamInput } from "@/lib/validation/team";

// Team actions (PRD §13.1, F-TEM-01). The rules live in the SQL functions (migration 0008);
// these validate input, call them as the signed-in student and map the error.

/** Create the team, its roles and the leader as a member in one transaction (`create_team`). */
export async function createTeam(
  input: CreateTeamInput & { extractionId?: string | null },
): Promise<ActionResult<{ teamId: string }>> {
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  const d = parsed.data;
  const { data, error } = await supabase.rpc("create_team", {
    p_competition: d.competitionId,
    p_name: d.name,
    p_goal: d.goal,
    p_work_time: d.workTime,
    p_leader_role_index: d.leaderRoleIndex,
    p_roles: d.roles.map((r) => ({
      name: r.name,
      description: r.description ?? null,
      color_key: r.colorKey,
      source: r.source,
      source_page: r.sourcePage,
      source_criterion: r.sourceCriterion,
      edited: r.edited,
      required_skills: r.requiredSkills.map((s) => ({
        skill_id: s.skillId,
        min_level: s.minLevel,
      })),
      optional_skill_ids: r.optionalSkillIds,
      hours_per_week: r.hoursPerWeek,
      slots: r.slots,
    })),
    ...(input.extractionId && { p_extraction: input.extractionId }),
  });
  if (error) {
    if (error.code !== "P0001") console.error("[team]", error.code, error.message);
    return failFromDb(error);
  }

  revalidatePath("/lomba", "layout");
  return ok({ teamId: data });
}
