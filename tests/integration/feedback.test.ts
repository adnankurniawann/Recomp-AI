import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
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

const factors = { coverage: 1, level: 0.925, availability: 0.75, experience: 0.867, fit: 1 };

// F-RNK-05: submit_recommendation_feedback and the read policy of migration 0013.
describe.skipIf(!hasLocalDb)("recommendation feedback", () => {
  let leader: Student;
  let member: Student;
  let candidate: Student;
  let outsider: Student;
  let competitionId: string;
  let team: TestTeam;

  beforeAll(async () => {
    [leader, member, candidate, outsider] = await Promise.all([
      createStudent("ketua"),
      createStudent("anggota"),
      createStudent("kandidat"),
      createStudent("luar"),
    ]);
    competitionId = await createCompetition();
    team = await createTeam(leader, competitionId, [{ name: "UI/UX Designer", slots: 1 }]);
    await addMember(team.teamId, competitionId, member.profileId, null);
  });

  afterAll(async () => {
    await deleteCompetition(competitionId);
    await deleteStudents();
  });

  const submit = (by: Student, feedback: "fit" | "not_fit", score = 92) =>
    by.db.rpc("submit_recommendation_feedback", {
      p_team_role: team.roleIds[0]!,
      p_candidate: candidate.profileId,
      p_score: score,
      p_factors: factors,
      p_feedback: feedback,
    });

  const rows = async (by: Student) =>
    (
      await by.db
        .from("recommendation_feedback")
        .select("feedback, score, created_by")
        .eq("team_role_id", team.roleIds[0]!)
    ).data;

  it("saves a member's choice with the shown score, and the latest choice wins", async () => {
    expect((await submit(leader, "fit")).error).toBeNull();
    expect(await rows(leader)).toEqual([
      { feedback: "fit", score: 92, created_by: leader.profileId },
    ]);

    expect((await submit(member, "not_fit", 80)).error).toBeNull();
    expect(await rows(member)).toEqual([
      { feedback: "not_fit", score: 80, created_by: member.profileId },
    ]);
  });

  it("refuses outsiders, both writing and reading", async () => {
    expect((await submit(outsider, "fit")).error?.message).toBe("NOT_MEMBER");
    expect(await rows(outsider)).toEqual([]);
    expect(await rows(candidate)).toEqual([]);
  });

  it("refuses a score outside 0–100 and direct inserts", async () => {
    expect((await submit(leader, "fit", 101)).error?.message).toBe("VALIDATION");

    const { error } = await leader.db.from("recommendation_feedback").insert({
      team_role_id: team.roleIds[0]!,
      candidate_id: outsider.profileId,
      score: 50,
      factors,
      feedback: "fit",
      created_by: leader.profileId,
    });
    expect(error).not.toBeNull();
    const { count } = await admin()
      .from("recommendation_feedback")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", outsider.profileId);
    expect(count).toBe(0);
  });
});
