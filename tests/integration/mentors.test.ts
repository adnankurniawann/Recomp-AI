import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anon,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
  hasLocalDb,
  type Student,
  type TestTeam,
} from "./supabase";

// F-MNT-02 and ADR 0003 for mentors: migration 0006.
describe.skipIf(!hasLocalDb)("mentor RLS", () => {
  let member: Student;
  let outsider: Student;
  let competitionId: string;
  let team: TestTeam;
  const active = randomUUID();
  const inactive = randomUUID();
  const service = randomUUID();
  const slot = randomUUID();
  const booking = randomUUID();

  beforeAll(async () => {
    [member, outsider] = await Promise.all([createStudent("anggota"), createStudent("orang")]);
    competitionId = await createCompetition();
    team = await createTeam(member, competitionId, [{ name: "UI/UX Designer", slots: 1 }]);

    const db = admin();
    const steps = [
      db.from("mentors").insert([
        {
          id: active,
          display_name: "Mentor Aktif",
          roles: ["uiux"],
          headline: "Juara 1",
          is_simulated: true,
          is_active: true,
        },
        {
          id: inactive,
          display_name: "Mentor Off",
          roles: ["backend"],
          headline: "Off",
          is_simulated: true,
          is_active: false,
        },
      ]),
      db.from("mentor_contacts").insert({ mentor_id: active, whatsapp: "+6281200000000" }),
      db
        .from("mentor_services")
        .insert({ id: service, mentor_id: active, name: "Review", duration_min: 60, price: 75000 }),
      db
        .from("mentor_slots")
        .insert({
          id: slot,
          mentor_id: active,
          starts_at: new Date(Date.now() + 864e5).toISOString(),
        }),
      db.from("bookings").insert({
        id: booking,
        team_id: team.teamId,
        booked_by: member.profileId,
        mentor_id: active,
        service_id: service,
        slot_id: slot,
        price: 75000,
        platform_fee: 15000,
        mentor_share: 60000,
      }),
    ];
    for (const step of steps) {
      const { error } = await step;
      if (error) throw new Error(error.message);
    }
  });

  afterAll(async () => {
    await admin().from("bookings").delete().eq("id", booking);
    await admin().from("mentors").delete().in("id", [active, inactive]);
    if (competitionId) await deleteCompetition(competitionId);
    await deleteStudents();
  });

  const contact = (db: Student["db"]) =>
    db.from("mentor_contacts").select("whatsapp").eq("mentor_id", active);

  it("shows active mentors, their services and slots to everyone, and hides inactive ones", async () => {
    const mentors = await anon().from("mentors").select("id").in("id", [active, inactive]);
    expect(mentors.data?.map((m) => m.id)).toEqual([active]);
    expect(
      (await anon().from("mentor_services").select("id").eq("mentor_id", active)).data,
    ).toHaveLength(1);
    expect(
      (await anon().from("mentor_slots").select("id").eq("mentor_id", active)).data,
    ).toHaveLength(1);
  });

  it("keeps the mentor's contact closed before payment", async () => {
    expect((await anon().from("mentor_contacts").select("whatsapp")).data ?? []).toEqual([]);
    expect((await contact(member.db)).data).toEqual([]);
  });

  it("opens the contact to members of a team with a paid booking, and nobody else", async () => {
    await admin()
      .from("bookings")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", booking);
    expect((await contact(member.db)).data).toHaveLength(1);
    expect((await contact(outsider.db)).data).toEqual([]);
  });

  it("doesn't let a student edit mentors", async () => {
    const edit = await member.db
      .from("mentors")
      .update({ verified: true })
      .eq("id", active)
      .select();
    expect(edit.data ?? []).toEqual([]);
  });
});
