import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isRoleFilled } from "@/lib/team/gap";
import { buildRankingPage, RankingSource } from "./build";
import type { RankingCandidate, RankingRole } from "./types";

export interface RoleMatch {
  role: RankingRole;
  /** Null when the profile isn't in this role's candidate list (filters of PRD §7.2). */
  candidate: RankingCandidate | null;
  /** Only for the leader of a team that is still forming, while the role has a free slot. */
  invite: { teamName: string; leaderName: string; competitionName: string } | null;
}

const uuid = z.uuid();

/**
 * The match panel on `/u/[username]?team=...&role=...` (F-PRF-06). Same score as the ranking tab:
 * `ranking_candidates` as the signed-in member, scored by lib/matching (ADR 0002). Null for anyone
 * who isn't a member of the team, when the role isn't the team's, or when a query fails: the page
 * then shows the plain profile.
 */
export async function loadRoleMatch(
  teamId: string | undefined,
  roleId: string | undefined,
  profileId: string,
): Promise<RoleMatch | null> {
  if (!uuid.safeParse(teamId).success || !uuid.safeParse(roleId).success) return null;
  const supabase = await createClient();

  const [{ data: me }, { data: team, error: teamError }] = await Promise.all([
    supabase.rpc("current_profile_id"),
    supabase
      .from("teams")
      .select(
        `name, status, leader_id, competition:competitions(name), team_roles(id, slots),
         team_members(team_role_id, is_leader, profile:profiles(id, full_name))`,
      )
      .eq("id", teamId!)
      .maybeSingle(),
  ]);
  if (teamError) console.error("loadRoleMatch: team query failed", teamError.message);
  const role = team?.team_roles.find((r) => r.id === roleId);
  if (!me || !team || !role || !team.team_members.some((m) => m.profile?.id === me)) return null;

  const { data, error } = await supabase.rpc("ranking_candidates", { p_team_role: roleId! });
  if (error) {
    console.error("loadRoleMatch: ranking_candidates failed", error.message);
    return null;
  }
  const source = RankingSource.safeParse(data);
  if (!source.success) {
    console.error("ranking_candidates returned an unexpected shape", source.error.issues);
    return null;
  }

  const page = buildRankingPage(source.data, {
    limit: source.data.candidates.length,
    offset: 0,
  });
  const memberCount = team.team_members.filter((m) => m.team_role_id === role.id).length;
  const canInvite =
    team.leader_id === me &&
    team.status === "forming" &&
    !isRoleFilled({ slots: role.slots, memberCount });
  return {
    role: page.role,
    candidate: page.candidates.find((c) => c.profile.id === profileId) ?? null,
    invite: canInvite
      ? {
          teamName: team.name,
          leaderName: team.team_members.find((m) => m.is_leader)?.profile?.full_name ?? "",
          competitionName: team.competition?.name ?? "",
        }
      : null,
  };
}
