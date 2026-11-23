import "server-only";
import { isRoleKey, type CompCategory, type RoleKey, type RoleSource } from "@/lib/constants";
import type { InviteStatus } from "@/lib/invites/status";
import { loadCourseCatalog, type CourseCard } from "@/lib/learn/catalog";
import { requiredSkillIdsFromJson } from "@/lib/profile/suggest";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";
import type { Enums } from "@/lib/supabase/types";
import { isRoleFilled, skillGap } from "./gap";

// The team dashboard /tim/[id] (PRD F-TEM-03..04, §10.4). Read under the viewer's session: RLS
// shows a forming team to everyone and a complete or archived team to its members only. Invites
// come back only for the people involved, so the page shows them to the leader.

export interface DashboardMember {
  profileId: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  isSimulated: boolean;
  isLeader: boolean;
}

export interface DashboardRole {
  id: string;
  name: string;
  colorKey: RoleKey;
  source: RoleSource;
  sourcePage: number | null;
  sourceCriterion: string | null;
  slots: number;
  requiredSkills: string[];
  members: DashboardMember[];
  filled: boolean;
}

export interface TeamDashboard {
  id: string;
  name: string;
  status: Enums<"team_status_t">;
  competition: {
    slug: string;
    name: string;
    category: CompCategory;
    teamMax: number;
    deadline: string | null;
  };
  roles: DashboardRole[];
  /** "Skill wajib yang belum tertutup" (F-TEM-04). */
  gap: string[];
  /** Students who marked the competition, the pool the ranking draws from. */
  interestCount: number;
  viewer: { isLeader: boolean; isMember: boolean; leaderName: string };
  /** Leader only; empty for anyone else. */
  invites: {
    id: string;
    status: InviteStatus;
    candidateName: string;
    roleName: string;
    roleColor: RoleKey;
  }[];
  /** Only when the team is complete (F-TEM-03). */
  suggestions: {
    courses: CourseCard[];
    mentors: { id: string; name: string; headline: string; photoUrl: string | null }[];
  } | null;
}

const SUGGESTION_COUNT = 3;

/** Null when the team doesn't exist or the viewer can't read it; redirect to sign-in first. */
export async function loadTeamDashboard(id: string): Promise<TeamDashboard | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [{ data: me }, { data: t, error }] = await Promise.all([
    supabase.rpc("current_profile_id"),
    supabase
      .from("teams")
      .select(
        `id, name, status, leader_id,
         competition:competitions(id, slug, name, category, team_max, registration_deadline),
         team_roles(id, name, color_key, source, source_page, source_criterion, required_skills, slots, sort),
         team_members(team_role_id, is_leader, joined_at,
           profile:profiles(id, username, full_name, avatar_url, is_simulated))`,
      )
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (error) throw new Error(`team: ${error.message}`);
  if (!t?.competition) return null;

  const isLeader = !!me && t.leader_id === me;
  const members = t.team_members
    .filter((m) => m.profile)
    .sort(
      (a, b) => Number(b.is_leader) - Number(a.is_leader) || a.joined_at.localeCompare(b.joined_at),
    )
    .map((m) => ({
      roleId: m.team_role_id,
      profileId: m.profile!.id,
      username: m.profile!.username,
      fullName: m.profile!.full_name,
      avatarUrl: m.profile!.avatar_url,
      isSimulated: m.profile!.is_simulated,
      isLeader: m.is_leader,
    }));

  const rawRoles = [...t.team_roles]
    .sort((a, b) => a.sort - b.sort)
    .map((r) => ({
      r,
      skillIds: requiredSkillIdsFromJson(r.required_skills),
      members: members.filter((m) => m.roleId === r.id),
    }));
  const gapIds = skillGap(
    rawRoles.map((x) => ({
      slots: x.r.slots,
      memberCount: x.members.length,
      requiredSkillIds: x.skillIds,
    })),
  );
  const allSkillIds = [...new Set(rawRoles.flatMap((x) => x.skillIds))];

  const [skills, interests, invites, suggestions] = await Promise.all([
    allSkillIds.length
      ? supabase.from("skills").select("id, name").in("id", allSkillIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    supabase
      .from("competition_interests")
      .select("profile_id", { count: "exact", head: true })
      .eq("competition_id", t.competition.id),
    isLeader
      ? supabase
          .from("invites")
          .select(
            "id, status, role:team_roles(name, color_key), candidate:profiles!invites_candidate_id_fkey(full_name)",
          )
          .eq("team_id", t.id)
          .eq("direction", "invite")
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    t.status === "complete" ? loadSuggestions(t.competition.category) : Promise.resolve(null),
  ]);
  const skillName = new Map((skills.data ?? []).map((s) => [s.id, s.name]));

  return {
    id: t.id,
    name: t.name,
    status: t.status,
    competition: {
      slug: t.competition.slug,
      name: t.competition.name,
      category: t.competition.category,
      teamMax: t.competition.team_max,
      deadline: t.competition.registration_deadline,
    },
    roles: rawRoles.map(({ r, skillIds, members: roleMembers }) => ({
      id: r.id,
      name: r.name,
      colorKey: isRoleKey(r.color_key) ? r.color_key : "other",
      source: r.source,
      sourcePage: r.source_page,
      sourceCriterion: r.source_criterion,
      slots: r.slots,
      requiredSkills: skillIds.flatMap((s) => skillName.get(s) ?? []),
      members: roleMembers,
      filled: isRoleFilled({ slots: r.slots, memberCount: roleMembers.length }),
    })),
    gap: gapIds.flatMap((s) => skillName.get(s) ?? []),
    interestCount: interests.count ?? 0,
    viewer: {
      isLeader,
      isMember: members.some((m) => m.profileId === me),
      leaderName: members.find((m) => m.isLeader)?.fullName ?? "",
    },
    invites: (invites.data ?? []).map((i) => ({
      id: i.id,
      status: i.status,
      candidateName: i.candidate?.full_name ?? "Mahasiswa",
      roleName: i.role?.name ?? "Role dihapus",
      roleColor: isRoleKey(i.role?.color_key) ? i.role.color_key : "other",
    })),
    suggestions,
  };
}

async function loadSuggestions(category: CompCategory): Promise<TeamDashboard["suggestions"]> {
  const supabase = await createClient();
  const [courses, { data: mentors }] = await Promise.all([
    loadCourseCatalog(),
    supabase
      .from("mentors")
      .select("id, display_name, headline, photo_path")
      .eq("is_active", true)
      .contains("competition_categories", [category])
      .order("verified", { ascending: false })
      .limit(SUGGESTION_COUNT),
  ]);
  return {
    courses: courses.filter((c) => c.category === category).slice(0, SUGGESTION_COUNT),
    mentors: (mentors ?? []).map((m) => ({
      id: m.id,
      name: m.display_name,
      headline: m.headline,
      photoUrl: publicStorageUrl("mentors", m.photo_path),
    })),
  };
}
