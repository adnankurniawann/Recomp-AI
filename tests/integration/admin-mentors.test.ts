import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
  hasLocalDb,
  type Student,
} from "./supabase";

const MENTOR = {
  display_name: "Mentor Uji",
  roles: ["uiux"],
  headline: "Juara 1 lomba uji",
  bio: "",
  competition_categories: ["hackathon"],
  verified: false,
  is_simulated: true,
  is_active: true,
};
const service = (name: string, price: number) => ({
  name,
  description: "",
  duration_min: 60,
  price,
});

// F-ADM-01: save_mentor (migration 0016) writes a mentor and their services, admins only.
describe.skipIf(!hasLocalDb)("save_mentor", () => {
  let boss: Student;
  let student: Student;
  let competitionId: string;
  let mentorId: string;

  beforeAll(async () => {
    [boss, student] = await Promise.all([
      createStudent("adminmentor"),
      createStudent("biasamentor"),
    ]);
    await admin().from("profiles").update({ app_role: "admin" }).eq("id", boss.profileId);
    competitionId = await createCompetition();
  });

  afterAll(async () => {
    if (mentorId) {
      await admin().from("bookings").delete().eq("mentor_id", mentorId);
      await admin().from("mentors").delete().eq("id", mentorId);
    }
    await deleteCompetition(competitionId);
    await deleteStudents();
  });

  const services = async () =>
    (
      await admin()
        .from("mentor_services")
        .select("id, name, price")
        .eq("mentor_id", mentorId)
        .order("price")
    ).data ?? [];

  it("refuses a student", async () => {
    const { error } = await student.db.rpc("save_mentor", {
      p_mentor: MENTOR,
      p_services: [service("Review", 50_000)],
    });
    expect(error?.message).toBe("FORBIDDEN");
  });

  it("adds a mentor with services, then edits, adds and removes services", async () => {
    const { data, error } = await boss.db.rpc("save_mentor", {
      p_mentor: MENTOR,
      p_services: [service("Review proposal", 75_000), service("Konsultasi tim", 150_000)],
    });
    expect(error).toBeNull();
    mentorId = data!;
    const [cheap, dear] = await services();
    expect([cheap?.name, dear?.name]).toEqual(["Review proposal", "Konsultasi tim"]);

    const { error: editErr } = await boss.db.rpc("save_mentor", {
      p_id: mentorId,
      p_mentor: { ...MENTOR, display_name: "Mentor Uji Baru", verified: true },
      p_services: [
        { id: cheap!.id, ...service("Review proposal 60 menit", 80_000) },
        service("Review pitch deck", 100_000),
      ],
    });
    expect(editErr).toBeNull();
    expect(await services()).toEqual([
      { id: cheap!.id, name: "Review proposal 60 menit", price: 80_000 },
      expect.objectContaining({ name: "Review pitch deck", price: 100_000 }),
    ]);
    const { data: m } = await admin()
      .from("mentors")
      .select("display_name, verified")
      .eq("id", mentorId)
      .single();
    expect(m).toEqual({ display_name: "Mentor Uji Baru", verified: true });
  });

  it("keeps a service that already has a booking", async () => {
    const [booked] = await services();
    const team = await createTeam(boss, competitionId, [{ name: "UI/UX", slots: 1 }]);
    const { error: bErr } = await admin().from("bookings").insert({
      team_id: team.teamId,
      booked_by: boss.profileId,
      mentor_id: mentorId,
      service_id: booked!.id,
      price: 80_000,
      platform_fee: 8_000,
      mentor_share: 72_000,
    });
    expect(bErr).toBeNull();

    const { error } = await boss.db.rpc("save_mentor", {
      p_id: mentorId,
      p_mentor: MENTOR,
      p_services: [service("Layanan lain", 50_000)],
    });
    expect(error?.message).toBe("SERVICE_IN_USE");
    expect(await services()).toHaveLength(2);
  });
});
