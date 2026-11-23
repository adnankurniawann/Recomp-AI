"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { teamPhrase } from "@/lib/invites/template";
import { createClient } from "@/lib/supabase/server";
import { username as usernameSchema } from "@/lib/validation/profile";
import {
  assignMemberRoleSchema,
  createTeamSchema,
  saveRolesSchema,
  type CreateTeamInput,
  type SaveRolesInput,
} from "@/lib/validation/team";

// Team actions (PRD §13.1, F-TEM-01). The rules live in the SQL functions (migration 0008);
// these validate input, call them as the signed-in student and map the error.

/** Create the team, its roles and the leader as a member in one transaction (`create_team`). */
export async function createTeam(
  input: CreateTeamInput & { extractionId?: string | null },
): Promise<ActionResult<{ teamId: string; invitesFailed: number }>> {
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
    p_roles: d.roles.map(toDbRole),
    ...(input.extractionId && { p_extraction: input.extractionId }),
  });
  if (error) {
    if (error.code !== "P0001") console.error("[team]", error.code, error.message);
    return failFromDb(error);
  }

  const invitesFailed = await sendStartingInvites(supabase, data, d);
  revalidatePath("/lomba", "layout");
  return ok({ teamId: data, invitesFailed });
}

type Client = Awaited<ReturnType<typeof createClient>>;

/** RoleInput as the snake_case JSON that create_team and save_roles read. */
function toDbRole(r: ReturnType<typeof saveRolesSchema.parse>["roles"][number]) {
  return {
    id: r.id ?? null,
    name: r.name,
    description: r.description ?? null,
    color_key: r.colorKey,
    source: r.source,
    source_page: r.sourcePage,
    source_criterion: r.sourceCriterion,
    edited: r.edited,
    required_skills: r.requiredSkills.map((s) => ({ skill_id: s.skillId, min_level: s.minLevel })),
    optional_skill_ids: r.optionalSkillIds,
    hours_per_week: r.hoursPerWeek,
    slots: r.slots,
  };
}

/** The leader replaces the team's roles (`save_roles`, F-TEM-02). */
export async function saveRoles(
  teamId: SaveRolesInput["teamId"],
  roles: SaveRolesInput["roles"],
): Promise<ActionResult<{ roles: string[] }>> {
  const parsed = saveRolesSchema.safeParse({ teamId, roles });
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_roles", {
    p_team: parsed.data.teamId,
    p_roles: parsed.data.roles.map(toDbRole),
  });
  if (error) {
    if (error.code !== "P0001") console.error("[team roles]", error.code, error.message);
    return failFromDb(error);
  }

  revalidatePath(`/tim/${parsed.data.teamId}`, "layout");
  return ok({ roles: data });
}

/** The leader moves a member to another role (`assign_member_role`, F-TEM-03). */
export async function assignMemberRole(
  teamId: string,
  profileId: string,
  roleId: string,
): Promise<ActionResult<Record<string, never>>> {
  const parsed = assignMemberRoleSchema.safeParse({ teamId, profileId, roleId });
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_member_role", {
    p_team: parsed.data.teamId,
    p_profile: parsed.data.profileId,
    p_role: parsed.data.roleId,
  });
  if (error) {
    if (error.code !== "P0001") console.error("[team member role]", error.code, error.message);
    return failFromDb(error);
  }

  revalidatePath(`/tim/${parsed.data.teamId}`, "layout");
  return ok({});
}

/**
 * Step 3 invites, sent after the team exists as normal `send_invite` calls. A failed invite (the
 * student joined another team meanwhile) does not undo the team; the count goes back to the UI.
 */
async function sendStartingInvites(
  supabase: Client,
  teamId: string,
  d: ReturnType<typeof createTeamSchema.parse>,
): Promise<number> {
  if (d.invites.length === 0) return 0;

  const [{ data: roles }, { data: people }, { data: competition }, { data: me }] =
    await Promise.all([
      supabase.from("team_roles").select("id, sort").eq("team_id", teamId),
      supabase
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          d.invites.map((i) => i.profileId),
        ),
      supabase.from("competitions").select("name").eq("id", d.competitionId).single(),
      supabase.rpc("current_profile_id"),
    ]);
  const leaderName =
    (await supabase.from("profiles").select("full_name").eq("id", me!).single()).data?.full_name ??
    "";

  let failed = 0;
  for (const invite of d.invites) {
    const roleId = roles?.find((r) => r.sort === invite.roleIndex)?.id;
    const name = people?.find((p) => p.id === invite.profileId)?.full_name ?? "";
    const { error } = roleId
      ? await supabase.rpc("send_invite", {
          p_team_role: roleId,
          p_candidate: invite.profileId,
          p_message: startingInviteMessage({
            candidateName: name,
            leaderName,
            teamName: d.name,
            competitionName: competition?.name ?? "lomba ini",
            roleName: d.roles[invite.roleIndex]!.name,
          }),
        })
      : { error: { code: "P0001", message: "ROLE_NOT_FOUND" } };
    if (error) {
      if (error.code !== "P0001") console.error("[team invite]", error.code, error.message);
      failed++;
    }
  }
  return failed;
}

function startingInviteMessage(m: {
  candidateName: string;
  leaderName: string;
  teamName: string;
  competitionName: string;
  roleName: string;
}): string {
  const first = (n: string, fallback: string) => n.trim().split(/\s+/)[0] || fallback;
  return `Halo ${first(m.candidateName, "kamu")}, aku ${first(m.leaderName, "ketua tim")} dari ${teamPhrase(m.teamName)} untuk ${m.competitionName}. Aku ajak kamu jadi ${m.roleName} di tim kami. Mau gabung?`.slice(
    0,
    500,
  );
}

/** Step 3 lookup: an onboarded student by username, so the leader sees who they add. */
export async function findStudent(
  username: string,
): Promise<ActionResult<{ profileId: string; fullName: string; username: string }>> {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return fail("VALIDATION", parsed.error.issues[0]!.message);

  const supabase = await createClient();
  const [{ data: me }, { data: p }] = await Promise.all([
    supabase.rpc("current_profile_id"),
    supabase
      .from("profiles")
      .select("id, full_name, username")
      .eq("username", parsed.data)
      .eq("onboarding_done", true)
      .maybeSingle(),
  ]);
  if (!me) return fail("AUTH_REQUIRED");
  if (!p?.username) return fail("NOT_FOUND", "Username ini belum terdaftar di Recomp AI.");
  if (p.id === me) return fail("FORBIDDEN", "Kamu sudah otomatis masuk tim sebagai ketua.");
  return ok({ profileId: p.id, fullName: p.full_name, username: p.username });
}
