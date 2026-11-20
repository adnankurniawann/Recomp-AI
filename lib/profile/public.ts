import "server-only";
import { cache } from "react";
import {
  COMP_CATEGORIES,
  isRoleKey,
  type CompCategory,
  type CompResult,
  type Goal,
  type Level,
  type PreferredRoleKey,
  type WorkTime,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

// The public profile at /u/[username] (PRD F-PRF-06, §10.6). Anyone can read it, signed in or not.
// Contacts live in profile_contacts and are never selected here (ADR 0003).

export interface PublicSkill {
  skillId: number;
  name: string;
  level: Level;
  evidenceUrl: string | null;
}

export interface PublicHistoryItem {
  id: string;
  competitionName: string;
  year: number;
  category: CompCategory;
  role: string | null;
  result: CompResult;
  evidenceUrl: string | null;
  note: string | null;
}

export interface PublicPortfolioItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  coverUrl: string | null;
  skillNames: string[];
}

export interface PublicInterest {
  slug: string;
  name: string;
  category: CompCategory;
  registrationDeadline: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  campus: string | null;
  major: string | null;
  entryYear: number | null;
  bio: string | null;
  preferredRoles: PreferredRoleKey[];
  hoursPerWeek: number;
  goal: Goal;
  workTime: WorkTime;
  openToInvite: boolean;
  isSimulated: boolean;
  /** The signed-in student is looking at their own profile. */
  isOwn: boolean;
  skills: PublicSkill[];
  history: PublicHistoryItem[];
  portfolio: PublicPortfolioItem[];
  interests: PublicInterest[];
}

const PROFILE_COLUMNS =
  "id, user_id, username, full_name, avatar_url, campus, major, entry_year, bio, preferred_roles, hours_per_week, goal, work_time, open_to_invite, onboarding_done, is_simulated";

/** Null when the username doesn't exist or the profile isn't finished, so half profiles stay hidden. */
export const loadPublicProfile = cache(async function loadPublicProfile(
  username: string,
): Promise<PublicProfile | null> {
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: p, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`public profile: ${error.message}`);
  if (!p || !p.onboarding_done || !p.username) return null;

  const [skills, history, portfolio, interests, auth] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("level, evidence_url, skill:skills(id, name)")
      .eq("profile_id", p.id),
    supabase
      .from("competition_history")
      .select("id, competition_name, year, category, role, result, evidence_url, note, created_at")
      .eq("profile_id", p.id)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("portfolio_items")
      .select("id, title, description, url, cover_path, skill_ids")
      .eq("profile_id", p.id)
      .order("sort"),
    supabase
      .from("competition_interests")
      .select("competition:competitions(slug, name, category, registration_deadline)")
      .eq("profile_id", p.id),
    supabase.auth.getUser(),
  ]);
  for (const r of [skills, history, portfolio, interests]) {
    if (r.error) throw new Error(`public profile rows: ${r.error.message}`);
  }

  const skillList: PublicSkill[] = (skills.data ?? [])
    .flatMap((s) =>
      s.skill
        ? [
            {
              skillId: s.skill.id,
              name: s.skill.name,
              level: s.level as Level,
              evidenceUrl: s.evidence_url,
            },
          ]
        : [],
    )
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, "id"));
  const skillNames = new Map(skillList.map((s) => [s.skillId, s.name]));

  return {
    id: p.id,
    username: p.username,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
    campus: p.campus,
    major: p.major,
    entryYear: p.entry_year,
    bio: p.bio,
    preferredRoles: p.preferred_roles.filter(
      (r): r is PreferredRoleKey => isRoleKey(r) && r !== "other",
    ),
    hoursPerWeek: p.hours_per_week,
    goal: p.goal,
    workTime: p.work_time,
    openToInvite: p.open_to_invite,
    isSimulated: p.is_simulated,
    isOwn: Boolean(auth.data.user && auth.data.user.id === p.user_id),
    skills: skillList,
    history: (history.data ?? []).map((h) => ({
      id: h.id,
      competitionName: h.competition_name,
      year: h.year,
      category: h.category,
      role: h.role,
      result: h.result,
      evidenceUrl: h.evidence_url,
      note: h.note,
    })),
    portfolio: (portfolio.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      coverUrl: publicStorageUrl("portfolio", item.cover_path),
      skillNames: item.skill_ids.flatMap((id) => (skillNames.has(id) ? [skillNames.get(id)!] : [])),
    })),
    interests: (interests.data ?? [])
      .flatMap((i) => (i.competition ? [i.competition] : []))
      .filter((c) => (COMP_CATEGORIES as readonly string[]).includes(c.category))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        category: c.category,
        registrationDeadline: c.registration_deadline,
      }))
      .sort((a, b) =>
        (a.registrationDeadline ?? "9999").localeCompare(b.registrationDeadline ?? "9999"),
      ),
  };
});
