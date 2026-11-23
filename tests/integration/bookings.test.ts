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

// F-MNT-03..04: create_booking, simulate_booking_payment and RLS on bookings (migration 0011).
describe.skipIf(!hasLocalDb)("mentor bookings", () => {
  let member: Student;
  let rival: Student;
  let outsider: Student;
  let competitionId: string;
  let team: TestTeam;
  let rivalTeam: TestTeam;
  const mentor = randomUUID();
  const service = randomUUID();
  const slots = [randomUUID(), randomUUID(), randomUUID()];

  beforeAll(async () => {
    [member, rival, outsider] = await Promise.all([
      createStudent("anggota"),
      createStudent("saingan"),
      createStudent("luar"),
    ]);
    competitionId = await createCompetition();
    team = await createTeam(member, competitionId, [{ name: "Backend", slots: 2 }]);
    rivalTeam = await createTeam(rival, competitionId, [{ name: "Backend", slots: 2 }]);

    const db = admin();
    const steps = [
      () =>
        db.from("mentors").insert({
          id: mentor,
          display_name: "Mentor Booking",
          roles: ["backend"],
          headline: "Juara 1",
          is_simulated: true,
        }),
      () =>
        db
          .from("mentor_services")
          .insert({
            id: service,
            mentor_id: mentor,
            name: "Review",
            duration_min: 30,
            price: 75001,
          }),
      () =>
        db.from("mentor_slots").insert(
          slots.map((id, i) => ({
            id,
            mentor_id: mentor,
            starts_at: new Date(Date.now() + (i + 1) * 864e5).toISOString(),
          })),
        ),
    ];
    for (const step of steps) {
      const { error } = await step();
      if (error) throw new Error(error.message);
    }
  });

  afterAll(async () => {
    await admin().from("bookings").delete().eq("mentor_id", mentor);
    await admin().from("mentors").delete().eq("id", mentor);
    await deleteCompetition(competitionId);
    await deleteStudents();
  });

  const book = (who: Student, teamId: string, slot: string) =>
    who.db.rpc("create_booking", { p_team: teamId, p_service: service, p_slot: slot });

  it("books a slot with the 20% platform fee, and a second call returns the same booking", async () => {
    const first = await book(member, team.teamId, slots[0]!);
    expect(first.error).toBeNull();
    const again = await book(member, team.teamId, slots[0]!);
    expect(again.data).toBe(first.data);

    const { data } = await member.db
      .from("bookings")
      .select("status, price, platform_fee, mentor_share, is_simulated")
      .eq("id", first.data!)
      .single();
    expect(data).toEqual({
      status: "pending_payment",
      price: 75001,
      platform_fee: 15000,
      mentor_share: 60001,
      is_simulated: true,
    });
  });

  it("refuses a slot another team holds and a team the student isn't in", async () => {
    expect((await book(rival, rivalTeam.teamId, slots[0]!)).error?.message).toBe("SLOT_TAKEN");
    expect((await book(outsider, team.teamId, slots[1]!)).error?.message).toBe("NOT_MEMBER");
  });

  it("pays once: the slot is taken and the team is notified", async () => {
    const { data: id } = await book(member, team.teamId, slots[1]!);
    const pay = () => member.db.rpc("simulate_booking_payment", { p_booking: id! });

    expect((await pay()).data).toBe("paid");
    expect((await pay()).error?.message).toBe("ALREADY_PAID");

    const db = admin();
    const { data: slot } = await db
      .from("mentor_slots")
      .select("is_booked")
      .eq("id", slots[1]!)
      .single();
    expect(slot?.is_booked).toBe(true);
    const { data: notes } = await db
      .from("notifications")
      .select("type, payload")
      .eq("profile_id", member.profileId)
      .eq("type", "booking_paid");
    expect(notes?.some((n) => (n.payload as { booking_id?: string }).booking_id === id)).toBe(true);
    expect((await book(rival, rivalTeam.teamId, slots[1]!)).error?.message).toBe("SLOT_TAKEN");
  });

  it("refuses payment from outside the team", async () => {
    const { data: id } = await book(member, team.teamId, slots[2]!);
    const res = await outsider.db.rpc("simulate_booking_payment", { p_booking: id! });
    expect(res.error?.message).toBe("NOT_MEMBER");
  });

  it("shows bookings to the team only and never takes direct writes", async () => {
    expect((await outsider.db.from("bookings").select("id").eq("mentor_id", mentor)).data).toEqual(
      [],
    );
    expect((await anon().from("bookings").select("id").eq("mentor_id", mentor)).data ?? []).toEqual(
      [],
    );
    const write = await member.db
      .from("bookings")
      .update({ status: "paid" })
      .eq("mentor_id", mentor)
      .select();
    expect(write.data ?? []).toEqual([]);
    const insert = await member.db.from("bookings").insert({
      team_id: team.teamId,
      booked_by: member.profileId,
      mentor_id: mentor,
      service_id: service,
      price: 0,
      platform_fee: 0,
      mentor_share: 0,
      status: "paid",
    });
    expect(insert.error).not.toBeNull();
  });
});
