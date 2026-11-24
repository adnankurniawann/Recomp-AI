import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadTeamDashboard } from "@/lib/team/queries";
import { buildRankingPage, RankingSource } from "./build";
import type { RankingCandidate, RankingRole } from "./types";

export interface RoleMatch {
  role: RankingRole;
  /** Null when the profile isn't in this role's candidate list (filters of PRD §7.2). */
  candidate: RankingCandidate | null;
  /** Only for the leader of a team that is still forming. */
  invite: { teamName: string; leaderName: string; competitionName: string } | null;
}

const uuid = z.uuid();

/**
 * The match panel on `/u/[username]?team=...&role=...` (F-PRF-06). Same score as the ranking tab:
 * `ranking_candidates` as the signed-in member, scored by lib/matching (ADR 0002). Null for anyone
 * who isn't a member of the team, or when the role isn't the team's.
 */
export async function loadRoleMatch(
  teamId: string | undefined,
  roleId: string | undefined,
  profileId: string,
): Promise<RoleMatch | null> {
  if (!uuid.safeParse(teamId).success || !uuid.safeParse(roleId).success) return null;
  const team = await loadTeamDashboard(teamId!);
  if (!team?.viewer.isMember || !team.roles.some((r) => r.id === roleId)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ranking_candidates", { p_team_role: roleId! });
  if (error) return null;
  const source = RankingSource.safeParse(data);
  if (!source.success) return null;

  const page = buildRankingPage(source.data, {
    limit: source.data.candidates.length,
    offset: 0,
  });
  return {
    role: page.role,
    candidate: page.candidates.find((c) => c.profile.id === profileId) ?? null,
    invite:
      team.viewer.isLeader && team.status === "forming"
        ? {
            teamName: team.name,
            leaderName: team.viewer.leaderName,
            competitionName: team.competition.name,
          }
        : null,
  };
}
