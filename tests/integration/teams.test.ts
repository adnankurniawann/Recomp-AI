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

// F-TEM-02: save_roles (migration 0009) replaces the roles of a team in one transaction.
describe.skipIf(!hasLocalDb)("save_roles", () => {
  let leader: Student;
  let other: Student;
  const competitions: string[] = [];

  beforeAll(async () => {
    [leader, other] = await Promise.all([createStudent("ketua"), createStudent("lain")]);
  });

  afterAll(async () => {
    for (const id of competitions) await deleteCompetition(id);
    await deleteStudents();
  });

  const role = (name: string, slots: number, id?: string) => ({
    ...(id && { id }),
    name,
    color_key: "backend",
    source: "manual",
    source_page: null,
    source_criterion: null,
    edited: false,
    required_skills: [{ skill_id: 1, min_level: 2 }],
    optional_skill_ids: [2],
    hours_per_week: 8,
    slots,
  });

  /** A team with roles A (leader's, 1 slot) and B (2 slots). */
  async function team() {
    const competitionId = await createCompetition();
    competitions.push(competitionId);
    const { data: teamId, error } = await leader.db.rpc("create_team", {
      p_competition: competitionId,
      p_name: "Tim Edit",
      p_goal: "win",
      p_work_time: "night",
      p_roles: [role("Role A", 1), role("Role B", 2)] as never,
      p_leader_role_index: 0,
    });
    if (error) throw new Error(error.message);
    const { data: roles } = await admin()
      .from("team_roles")
      .select("id, name")
      .eq("team_id", teamId!)
      .order("sort");
    return { teamId: teamId!, a: roles![0]!.id, b: roles![1]!.id };
  }

  const save = (who: Student, teamId: string, roles: unknown[]) =>
    who.db.rpc("save_roles", { p_team: teamId, p_roles: roles as never });

  it("updates, adds, deletes and reorders roles", async () => {
    const t = await team();
    const { data: ids, error } = await save(leader, t.teamId, [
      role("Role Baru", 1),
      role("Role A diubah", 1, t.a),
    ]);
    expect(error).toBeNull();

    const { data: roles } = await admin()
      .from("team_roles")
      .select("id, name")
      .eq("team_id", t.teamId)
      .order("sort");
    expect(roles?.map((r) => r.name)).toEqual(["Role Baru", "Role A diubah"]);
    expect(roles?.[1]?.id).toBe(t.a);
    expect(ids).toEqual(roles?.map((r) => r.id));
  });

  it("recomputes the team status", async () => {
    const t = await team();
    await save(leader, t.teamId, [role("Role A", 1, t.a)]);
    const status = async () =>
      (await admin().from("teams").select("status").eq("id", t.teamId).single()).data?.status;
    expect(await status()).toBe("complete");
    await save(leader, t.teamId, [role("Role A", 1, t.a), role("Role C", 1)]);
    expect(await status()).toBe("forming");
  });

  it("refuses anyone but the leader", async () => {
    const t = await team();
    expect((await save(other, t.teamId, [role("Role A", 1, t.a)])).error?.message).toBe(
      "NOT_LEADER",
    );
  });

  it("refuses more slots than team_max", async () => {
    const t = await team();
    const { error } = await save(leader, t.teamId, [
      role("Role A", 1, t.a),
      role("Role B", 3, t.b),
      role("Role C", 1),
    ]);
    expect(error?.message).toBe("SLOTS_EXCEED_MAX");
  });

  it("refuses to delete a role that has members or cut its slots below them", async () => {
    const t = await team();
    expect((await save(leader, t.teamId, [role("Role B", 2, t.b)])).error?.message).toBe(
      "ROLE_HAS_MEMBERS",
    );
  });

  it("refuses a role id from another team", async () => {
    const [t1, t2] = [await team(), await team()];
    const { error } = await save(leader, t1.teamId, [role("Role A", 1, t1.a), role("X", 1, t2.b)]);
    expect(error?.message).toBe("ROLE_NOT_FOUND");
  });
});
