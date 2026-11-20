import "server-only";
import { isRoleKey, type Level, type RoleKey } from "@/lib/constants";
import { requiredSkillIdsFromJson } from "@/lib/profile/suggest";
import { createClient } from "@/lib/supabase/server";
import type { InviteStatus } from "./status";

// The /undangan page (PRD F-INV-02, §10.11): invites to the student and invites they sent.
// Everything is read under the student's session; RLS on invites decides what comes back.

export interface InvitePerson {
  id: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  colorKey: RoleKey | null;
}

export interface InviteView {
  id: string;
  status: InviteStatus;
  message: string | null;
  createdAt: string;
  aiDrafted: boolean;
  team: { id: string; name: string } | null;
  competition: { id: string; slug: string; name: string } | null;
  role: {
    id: string;
    name: string;
    colorKey: RoleKey;
    hoursPerWeek: number;
    requiredSkills: { name: string; minLevel: Level }[];
  } | null;
  candidate: InvitePerson | null;
  sender: InvitePerson | null;
  /** Current members of the team, for incoming invites (leader first). */
  members: (InvitePerson & { isLeader: boolean })[];
}

export interface InviteInbox {
  incoming: InviteView[];
  sent: InviteView[];
  /** Competitions the student already has a team for: "Terima" is off there (PRD §5.3). */
  competitionsWithTeam: string[];
}

const PERSON = "id, username, full_name, avatar_url, preferred_roles";

type PersonRow = {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  preferred_roles: string[];
};

function person(row: PersonRow | null): InvitePerson | null {
  if (!row) return null;
  const first = row.preferred_roles[0];
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    colorKey: isRoleKey(first) ? first : null,
  };
}

/** Pending first, then newest. */
function byStatusThenDate(a: InviteView, b: InviteView) {
  const rank = (v: InviteView) => (v.status === "pending" ? 0 : 1);
  return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt);
}

/** Null when signed out. */
export async function loadInviteInbox(): Promise<InviteInbox | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) return null;

  const [invites, memberships] = await Promise.all([
    supabase
      .from("invites")
      .select(
        `id, status, direction, message, created_at, ai_drafted, candidate_id, created_by,
         team:teams(id, name, competition:competitions(id, slug, name)),
         role:team_roles(id, name, color_key, hours_per_week, required_skills),
         candidate:profiles!invites_candidate_id_fkey(${PERSON}),
         sender:profiles!invites_created_by_fkey(${PERSON})`,
      )
      .eq("direction", "invite")
      .or(`candidate_id.eq.${me.id},created_by.eq.${me.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("team_members").select("competition_id").eq("profile_id", me.id),
  ]);
  if (invites.error) throw new Error(`invites: ${invites.error.message}`);
  if (memberships.error) throw new Error(`memberships: ${memberships.error.message}`);
  const rows = invites.data ?? [];

  // Skill names for the required skills, and the members of teams that invited the student.
  const skillIds = [
    ...new Set(rows.flatMap((r) => requiredSkillIdsFromJson(r.role?.required_skills))),
  ];
  const incomingTeamIds = [
    ...new Set(rows.filter((r) => r.candidate_id === me.id && r.team).map((r) => r.team!.id)),
  ];
  const [skills, members] = await Promise.all([
    skillIds.length
      ? supabase.from("skills").select("id, name").in("id", skillIds)
      : Promise.resolve({ data: [], error: null }),
    incomingTeamIds.length
      ? supabase
          .from("team_members")
          .select(
            `team_id, is_leader, joined_at, profile:profiles!team_members_profile_id_fkey(${PERSON})`,
          )
          .in("team_id", incomingTeamIds)
          .order("joined_at")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (skills.error) throw new Error(`skills: ${skills.error.message}`);
  if (members.error) throw new Error(`members: ${members.error.message}`);

  const skillName = new Map((skills.data ?? []).map((s) => [s.id, s.name]));
  const membersByTeam = new Map<string, InviteView["members"]>();
  for (const m of members.data ?? []) {
    const p = person(m.profile);
    if (!p) continue;
    const list = membersByTeam.get(m.team_id) ?? [];
    list.push({ ...p, isLeader: m.is_leader });
    membersByTeam.set(m.team_id, list);
  }
  for (const list of membersByTeam.values())
    list.sort((a, b) => Number(b.isLeader) - Number(a.isLeader));

  const view = (r: (typeof rows)[number]): InviteView => ({
    id: r.id,
    status: r.status,
    message: r.message,
    createdAt: r.created_at,
    aiDrafted: r.ai_drafted,
    team: r.team ? { id: r.team.id, name: r.team.name } : null,
    competition: r.team?.competition ?? null,
    role: r.role
      ? {
          id: r.role.id,
          name: r.role.name,
          colorKey: isRoleKey(r.role.color_key) ? r.role.color_key : "other",
          hoursPerWeek: r.role.hours_per_week,
          requiredSkills: (Array.isArray(r.role.required_skills)
            ? r.role.required_skills
            : []
          ).flatMap((s) => {
            const { skill_id, min_level } = (s ?? {}) as { skill_id?: number; min_level?: number };
            const name = skill_id ? skillName.get(skill_id) : undefined;
            return name
              ? [{ name, minLevel: Math.min(4, Math.max(1, min_level ?? 1)) as Level }]
              : [];
          }),
        }
      : null,
    candidate: person(r.candidate),
    sender: person(r.sender),
    members: r.team ? (membersByTeam.get(r.team.id) ?? []) : [],
  });

  return {
    incoming: rows
      .filter((r) => r.candidate_id === me.id)
      .map(view)
      .sort(byStatusThenDate),
    sent: rows
      .filter((r) => r.created_by === me.id)
      .map(view)
      .sort(byStatusThenDate),
    competitionsWithTeam: [...new Set((memberships.data ?? []).map((m) => m.competition_id))],
  };
}
