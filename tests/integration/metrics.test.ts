import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TrialMetrics } from "@/lib/admin/metrics";
import {
  admin,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
  hasLocalDb,
  type Student,
  type TestTeam,
} from "./supabase";

const factors = { coverage: 1, level: 1, availability: 1, experience: 0, fit: 1 };

// F-ADM-01, PRD §17: trial_metrics() and events of migration 0015.
describe.skipIf(!hasLocalDb)("trial metrics", () => {
  let boss: Student;
  let leader: Student;
  let real1: Student;
  let real2: Student;
  let competitionId: string;
  let team: TestTeam;
  let before: TrialMetrics;

  const metrics = async () => {
    const { data, error } = await boss.db.rpc("trial_metrics");
    if (error) throw new Error(error.message);
    return TrialMetrics.parse(data);
  };

  beforeAll(async () => {
    boss = await createStudent("admin");
    await admin().from("profiles").update({ app_role: "admin" }).eq("id", boss.profileId);
    before = await metrics();

    [leader, real1, real2] = await Promise.all([
      createStudent("ketua"),
      createStudent("asli1"),
      createStudent("asli2"),
    ]);
    competitionId = await createCompetition();
    team = await createTeam(leader, competitionId, [{ name: "UI/UX Designer", slots: 2 }]);

    for (const [c, f] of [
      [real1, "fit"],
      [real2, "not_fit"],
    ] as const) {
      const { error } = await leader.db.rpc("submit_recommendation_feedback", {
        p_team_role: team.roleIds[0]!,
        p_candidate: c.profileId,
        p_score: 80,
        p_factors: factors,
        p_feedback: f,
      });
      if (error) throw new Error(error.message);
    }
    for (const c of [real1, real2]) {
      const { error } = await leader.db.rpc("send_invite", {
        p_team_role: team.roleIds[0]!,
        p_candidate: c.profileId,
        p_message: "Halo!",
      });
      if (error) throw new Error(error.message);
    }
    const { data: inv } = await admin()
      .from("invites")
      .select("id")
      .eq("candidate_id", real1.profileId)
      .single();
    await real1.db.rpc("accept_invite", { p_invite: inv!.id });

    const { error } = await leader.db
      .from("events")
      .insert({ profile_id: leader.profileId, team_id: team.teamId, type: "ranking_viewed" });
    if (error) throw new Error(error.message);
  });

  afterAll(async () => {
    await deleteCompetition(competitionId);
    await deleteStudents();
  });

  it("is for admins only", async () => {
    expect((await leader.db.rpc("trial_metrics")).error?.message).toBe("FORBIDDEN");
  });

  it("counts real feedback, invites, teams and ranking views", async () => {
    const after = await metrics();
    const d = (k: (m: TrialMetrics) => number) => k(after) - k(before);
    expect(d((m) => m.real.participants)).toBe(3);
    expect(d((m) => m.real.teams)).toBe(1);
    expect(d((m) => m.real.feedback.fit)).toBe(1);
    expect(d((m) => m.real.feedback.not_fit)).toBe(1);
    expect(d((m) => m.real.invites.accepted)).toBe(1);
    expect(d((m) => m.real.invites.pending)).toBe(1);
    expect(d((m) => m.real.minutes_to_ranking.length)).toBe(1);
    expect(d((m) => m.simulated.feedback.fit)).toBe(0);
  });

  it("lets a student log only their own events and read none", async () => {
    const forged = await real2.db
      .from("events")
      .insert({ profile_id: leader.profileId, team_id: team.teamId, type: "ranking_viewed" });
    expect(forged.error).not.toBeNull();
    expect((await leader.db.from("events").select("id")).data).toEqual([]);
  });
});
