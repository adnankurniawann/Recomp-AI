import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
  admin,
  anon,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
  hasLocalDb,
  type Student,
} from "./supabase";

// PRD §16.2 no. 1, F-PRF-05, ADR 0003: contacts open only to the owner and teammates.
describe.skipIf(!hasLocalDb)("profile contacts RLS", () => {
  let a: Student;
  let b: Student;
  let competitionId: string;

  beforeAll(async () => {
    [a, b] = await Promise.all([createStudent("ani"), createStudent("budi")]);
    competitionId = await createCompetition();
  });

  afterAll(async () => {
    if (competitionId) await deleteCompetition(competitionId);
    await deleteStudents();
  });

  const readContacts = (s: Student, profileId: string) =>
    s.db.from("profile_contacts").select("whatsapp").eq("profile_id", profileId);

  it("lets a student read their own contact", async () => {
    const { data } = await readContacts(a, a.profileId);
    expect(data).toHaveLength(1);
  });

  it("hides another student's contact before they are teammates", async () => {
    const { data, error } = await readContacts(a, b.profileId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("never puts a contact in the public profile, even when embedded", async () => {
    const { data } = await a.db
      .from("profiles")
      .select("*, profile_contacts(whatsapp)")
      .eq("id", b.profileId)
      .single();
    expect(data).not.toHaveProperty("whatsapp");
    expect(data?.profile_contacts).toBeNull();
  });

  it("shows no contact at all to someone signed out", async () => {
    const { data } = await anon().from("profile_contacts").select("whatsapp");
    expect(data ?? []).toEqual([]);
  });

  it("doesn't let a student change or create another student's contact", async () => {
    const updated = await a.db
      .from("profile_contacts")
      .update({ whatsapp: "+6280000000000" })
      .eq("profile_id", b.profileId)
      .select();
    expect(updated.data).toEqual([]);

    const inserted = await a.db
      .from("profile_contacts")
      .insert({ profile_id: b.profileId, whatsapp: "+6280000000000" });
    expect(inserted.error).not.toBeNull();
  });

  it("opens contacts between teammates, and closes them when one leaves", async () => {
    const team = await createTeam(a, competitionId, [{ name: "UI/UX Designer", slots: 1 }]);
    await addMember(team.teamId, competitionId, b.profileId, team.roleIds[0]!);

    expect((await readContacts(a, b.profileId)).data).toHaveLength(1);
    expect((await readContacts(b, a.profileId)).data).toHaveLength(1);

    await admin()
      .from("team_members")
      .delete()
      .eq("team_id", team.teamId)
      .eq("profile_id", b.profileId);
    expect((await readContacts(a, b.profileId)).data).toEqual([]);
  });
});

describe.skipIf(!hasLocalDb)("profile columns and ownership", () => {
  let a: Student;
  let b: Student;

  beforeAll(async () => {
    [a, b] = await Promise.all([createStudent("cici"), createStudent("dodi")]);
  });

  afterAll(deleteStudents);

  it("lets the owner edit their profile but not someone else's", async () => {
    const own = await a.db
      .from("profiles")
      .update({ bio: "Halo" })
      .eq("id", a.profileId)
      .select("bio");
    expect(own.data).toEqual([{ bio: "Halo" }]);

    const other = await a.db.from("profiles").update({ bio: "x" }).eq("id", b.profileId).select();
    expect(other.data).toEqual([]);
  });

  it.each([
    ["app_role", { app_role: "admin" as const }],
    ["is_simulated", { is_simulated: true }],
    ["onboarding_done", { onboarding_done: false }],
  ])("rejects a direct change to %s", async (_column, patch) => {
    const { error } = await a.db.from("profiles").update(patch).eq("id", a.profileId);
    expect(error?.message).toBe("FORBIDDEN");
  });

  it("refuses a portfolio link that isn't https", async () => {
    const { error } = await a.db
      .from("portfolio_items")
      .insert({ profile_id: a.profileId, title: "Karya", url: "http://contoh.id" });
    expect(error?.code).toBe("23514");
  });
});
