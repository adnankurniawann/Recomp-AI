// Helpers for the database integration tests (PRD §16.2). The service role key is used here only
// to arrange rows and accounts; every assertion runs as a signed-in student with the anon key, so
// RLS and the SQL functions decide what happens, as in the app.
import { randomUUID } from "node:crypto";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/lib/supabase/types";

export type Db = SupabaseClient<Database>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True only for a local Supabase, so these tests can never write to the cloud project. */
export const hasLocalDb =
  Boolean(url && anonKey && serviceKey) && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url);

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

let adminClient: Db | null = null;
export function admin(): Db {
  adminClient ??= createClient<Database>(url, serviceKey, noSession);
  return adminClient;
}

export function anon(): Db {
  return createClient<Database>(url, anonKey, noSession);
}

export interface Student {
  userId: string;
  profileId: string;
  username: string;
  db: Db;
  /** The signed-in session, for putting the same student in a browser (tests/e2e). */
  session: Session;
}

const created: string[] = [];

/**
 * A signed-in student with a finished profile and a WhatsApp number. With `onboarded: false` the
 * account is brand new instead: the profile the sign-up trigger made, nothing filled in.
 */
export async function createStudent(
  label: string,
  patch: TablesUpdate<"profiles"> = {},
  { onboarded = true }: { onboarded?: boolean } = {},
): Promise<Student> {
  const suffix = randomUUID().slice(0, 8);
  const email = `${label}-${suffix}@test.local`;
  const password = `pw-${randomUUID()}`;
  const username = `${label}_${suffix}`.toLowerCase().slice(0, 20);

  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Tes ${label}` },
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  created.push(data.user.id);

  const { data: profile, error: pErr } = await admin()
    .from("profiles")
    .update(
      onboarded
        ? {
            username,
            campus: "Kampus Tes",
            major: "Informatika",
            entry_year: 2024,
            preferred_roles: ["uiux"],
            hours_per_week: 8,
            onboarding_done: true,
            ...patch,
          }
        : { full_name: `Tes ${label}`, ...patch },
    )
    .eq("user_id", data.user.id)
    .select("id")
    .single();
  if (pErr || !profile) throw new Error(`profile: ${pErr?.message}`);

  if (onboarded) {
    const { error: cErr } = await admin()
      .from("profile_contacts")
      .insert({ profile_id: profile.id, whatsapp: `+628${Math.floor(1e9 + Math.random() * 9e9)}` });
    if (cErr) throw new Error(`contact: ${cErr.message}`);
  }

  const db = createClient<Database>(url, anonKey, noSession);
  const { data: signedIn, error: sErr } = await db.auth.signInWithPassword({ email, password });
  if (sErr || !signedIn.session) throw new Error(`signIn: ${sErr?.message}`);

  return { userId: data.user.id, profileId: profile.id, username, db, session: signedIn.session };
}

/** Delete every account made by createStudent; profiles and their rows cascade. */
export async function deleteStudents() {
  while (created.length) {
    const id = created.pop()!;
    await admin().auth.admin.deleteUser(id);
  }
}

export async function createCompetition(): Promise<string> {
  const slug = `tes-${randomUUID().slice(0, 8)}`;
  const { data, error } = await admin()
    .from("competitions")
    .insert({ slug, name: `Lomba ${slug}`, organizer: "Tes", category: "hackathon", team_max: 4 })
    .select("id")
    .single();
  if (error || !data) throw new Error(`competition: ${error?.message}`);
  return data.id;
}

export async function deleteCompetition(id: string) {
  await admin().from("competitions").delete().eq("id", id);
}

export interface TestTeam {
  teamId: string;
  roleIds: string[];
}

/** A team led by `leader`, with the leader already a member (as `create_team` will do). */
export async function createTeam(
  leader: Student,
  competitionId: string,
  roles: { name: string; slots: number }[],
): Promise<TestTeam> {
  const { data: team, error } = await admin()
    .from("teams")
    .insert({
      competition_id: competitionId,
      leader_id: leader.profileId,
      name: `Tim ${randomUUID().slice(0, 6)}`,
      goal: "win",
      work_time: "night",
    })
    .select("id")
    .single();
  if (error || !team) throw new Error(`team: ${error?.message}`);

  const { data: roleRows, error: rErr } = await admin()
    .from("team_roles")
    .insert(
      roles.map((r, i) => ({
        team_id: team.id,
        name: r.name,
        color_key: "uiux",
        source: "manual" as const,
        required_skills: [{ skill_id: 16, min_level: 2 }],
        hours_per_week: 8,
        slots: r.slots,
        sort: i,
      })),
    )
    .select("id, sort")
    .order("sort");
  if (rErr || !roleRows) throw new Error(`roles: ${rErr?.message}`);

  await addMember(team.id, competitionId, leader.profileId, null, true);
  return { teamId: team.id, roleIds: roleRows.map((r) => r.id) };
}

export async function addMember(
  teamId: string,
  competitionId: string,
  profileId: string,
  roleId: string | null,
  isLeader = false,
) {
  const { error } = await admin().from("team_members").insert({
    team_id: teamId,
    competition_id: competitionId,
    profile_id: profileId,
    team_role_id: roleId,
    is_leader: isLeader,
  });
  if (error) throw new Error(`member: ${error.message}`);
}
