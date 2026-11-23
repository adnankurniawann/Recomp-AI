import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anon,
  createCompetition,
  createStudent,
  deleteCompetition,
  deleteStudents,
  hasLocalDb,
  type Student,
} from "./supabase";

// F-TEM-01: create_team (migration 0008) makes the team, roles and leader in one transaction.
describe.skipIf(!hasLocalDb)("create_team", () => {
  let leader: Student;
  const competitions: string[] = [];

  beforeAll(async () => {
    leader = await createStudent("ketua");
  });

  afterAll(async () => {
    for (const id of competitions) await deleteCompetition(id);
    await deleteStudents();
  });

  const role = (name: string, slots: number, skillId = 1) => ({
    name,
    color_key: "frontend",
    source: "template",
    source_page: null,
    source_criterion: null,
    edited: false,
    required_skills: [{ skill_id: skillId, min_level: 2 }],
    optional_skill_ids: [],
    hours_per_week: 8,
    slots,
  });

  async function create(roles: unknown[], competitionId?: string, leaderRoleIndex = 1) {
    const id = competitionId ?? (await createCompetition());
    if (!competitionId) competitions.push(id);
    const res = await leader.db.rpc("create_team", {
      p_competition: id,
      p_name: "Tim Tes",
      p_goal: "win",
      p_work_time: "night",
      p_roles: roles as never,
      p_leader_role_index: leaderRoleIndex,
    });
    return { competitionId: id, ...res };
  }

  it("creates the team, its roles in order and the leader in the chosen role", async () => {
    const { data: teamId, error } = await create([role("Frontend", 2), role("Backend", 1)]);
    expect(error).toBeNull();

    const db = admin();
    const { data: team } = await db.from("teams").select("*").eq("id", teamId!).single();
    const { data: roles } = await db
      .from("team_roles")
      .select("id, name, sort")
      .eq("team_id", teamId!)
      .order("sort");
    const { data: members } = await db.from("team_members").select("*").eq("team_id", teamId!);

    expect(team).toMatchObject({ leader_id: leader.profileId, status: "forming" });
    expect(roles?.map((r) => r.name)).toEqual(["Frontend", "Backend"]);
    expect(members).toHaveLength(1);
    expect(members![0]).toMatchObject({
      profile_id: leader.profileId,
      is_leader: true,
      team_role_id: roles![1]!.id,
    });
  });

  it("marks the team complete when the leader fills its only slot", async () => {
    const { data: teamId } = await create([role("Solo", 1)], undefined, 0);
    const { data } = await admin().from("teams").select("status").eq("id", teamId!).single();
    expect(data?.status).toBe("complete");
  });

  it("rejects a second team in the same competition", async () => {
    const first = await create([role("Frontend", 1), role("Backend", 1)]);
    const second = await create([role("Frontend", 1)], first.competitionId, 0);
    expect(second.error?.message).toBe("ALREADY_HAS_TEAM");
  });

  it("rejects more slots than team_max", async () => {
    const { error } = await create([role("Frontend", 3), role("Backend", 2)]);
    expect(error?.message).toBe("SLOTS_EXCEED_MAX");
  });

  it("rejects an unknown skill and a leader role outside the list", async () => {
    expect((await create([role("Frontend", 1, 999999)], undefined, 0)).error?.message).toBe(
      "VALIDATION",
    );
    expect((await create([role("Frontend", 1)], undefined, 3)).error?.message).toBe("VALIDATION");
  });

  it("is not callable without a session", async () => {
    const { data, error } = await anon().rpc("create_team", {
      p_competition: competitions[0]!,
      p_name: "Tim Anon",
      p_goal: "win",
      p_work_time: "night",
      p_roles: [role("Frontend", 1)] as never,
      p_leader_role_index: 0,
    });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
