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
  type TestTeam,
} from "./supabase";

// F-INV-01..03 and PRD §16.2 no. 2 to 4: invites go through the SQL functions of migration 0004.
describe.skipIf(!hasLocalDb)("invites", () => {
  let leader: Student;
  let c1: Student;
  let c2: Student;
  let outsider: Student;
  const competitions: string[] = [];

  beforeAll(async () => {
    [leader, c1, c2, outsider] = await Promise.all([
      createStudent("ketua"),
      createStudent("kand1"),
      createStudent("kand2"),
      createStudent("luar"),
    ]);
  });

  afterAll(async () => {
    for (const id of competitions) await deleteCompetition(id);
    await deleteStudents();
  });

  /** A fresh competition and a team led by `leader`, so tests never share memberships. */
  async function freshTeam(roles = [{ name: "UI/UX Designer", slots: 1 }]) {
    const competitionId = await createCompetition();
    competitions.push(competitionId);
    const team = await createTeam(leader, competitionId, roles);
    return { competitionId, ...team };
  }

  function send(
    from: Student,
    team: TestTeam,
    to: Student,
    roleIndex = 0,
    message = "Halo, mau gabung?",
  ) {
    return from.db.rpc("send_invite", {
      p_team_role: team.roleIds[roleIndex]!,
      p_candidate: to.profileId,
      p_message: message,
    });
  }

  async function sent(team: TestTeam, to: Student, roleIndex = 0) {
    const { data, error } = await send(leader, team, to, roleIndex);
    if (error) throw new Error(error.message);
    return data;
  }

  const status = async (inviteId: string) =>
    (await admin().from("invites").select("status").eq("id", inviteId).single()).data?.status;

  it("sends an invite the candidate and the sender can see, but nobody else, and notifies the candidate", async () => {
    const team = await freshTeam();
    const inviteId = await sent(team, c1);

    expect((await c1.db.from("invites").select("id").eq("id", inviteId)).data).toHaveLength(1);
    expect((await leader.db.from("invites").select("id").eq("id", inviteId)).data).toHaveLength(1);
    expect((await outsider.db.from("invites").select("id").eq("id", inviteId)).data).toEqual([]);

    const { data: notes } = await admin()
      .from("notifications")
      .select("type, payload")
      .eq("profile_id", c1.profileId)
      .eq("type", "invite_received");
    expect(notes?.some((n) => (n.payload as { invite_id?: string }).invite_id === inviteId)).toBe(
      true,
    );
  });

  it("refuses a sender who isn't the leader, a second pending invite, and a candidate with a team", async () => {
    const team = await freshTeam();
    expect((await send(outsider, team, c1)).error?.message).toBe("NOT_LEADER");

    await sent(team, c1);
    expect((await send(leader, team, c1)).error?.message).toBe("ALREADY_PENDING");

    const other = await createTeam(c2, team.competitionId, [{ name: "Backend", slots: 1 }]);
    expect(other.teamId).toBeTruthy();
    expect((await send(leader, team, c2)).error?.message).toBe("CANDIDATE_HAS_TEAM");
  });

  it("rejects a message over 500 characters", async () => {
    const team = await freshTeam();
    const { error } = await send(leader, team, c1, 0, "a".repeat(501));
    expect(error?.code).toBe("23514");
  });

  it("accepts: the candidate joins the role, contacts open both ways and the team becomes complete", async () => {
    const team = await freshTeam();
    const inviteId = await sent(team, c1);

    // Before: no contacts across.
    expect(
      (await leader.db.from("profile_contacts").select("whatsapp").eq("profile_id", c1.profileId))
        .data,
    ).toEqual([]);

    const { data: teamId, error } = await c1.db.rpc("accept_invite", { p_invite: inviteId });
    expect(error).toBeNull();
    expect(teamId).toBe(team.teamId);
    expect(await status(inviteId)).toBe("accepted");

    const { data: member } = await admin()
      .from("team_members")
      .select("team_role_id")
      .eq("team_id", team.teamId)
      .eq("profile_id", c1.profileId)
      .single();
    expect(member?.team_role_id).toBe(team.roleIds[0]);

    // PRD §16.2 no. 2: after accept_invite both can read each other's contact.
    expect(
      (await leader.db.from("profile_contacts").select("whatsapp").eq("profile_id", c1.profileId))
        .data,
    ).toHaveLength(1);
    expect(
      (await c1.db.from("profile_contacts").select("whatsapp").eq("profile_id", leader.profileId))
        .data,
    ).toHaveLength(1);

    const { data: t } = await admin().from("teams").select("status").eq("id", team.teamId).single();
    expect(t?.status).toBe("complete");
  });

  it("lets only one of two simultaneous accepts take the last slot (PRD §16.2 no. 3)", async () => {
    for (let round = 0; round < 3; round++) {
      const team = await freshTeam();
      const [i1, i2] = [await sent(team, c1), await sent(team, c2)];

      const results = await Promise.all([
        c1.db.rpc("accept_invite", { p_invite: i1 }),
        c2.db.rpc("accept_invite", { p_invite: i2 }),
      ]);
      const wins = results.filter((r) => !r.error);
      const losses = results.filter((r) => r.error).map((r) => r.error?.message);

      expect(wins).toHaveLength(1);
      expect(losses).toEqual(["ROLE_FULL"]);

      const { count } = await admin()
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_role_id", team.roleIds[0]!);
      expect(count).toBe(1);
      // The loser's invite expired with the role.
      expect([await status(i1), await status(i2)].sort()).toEqual(["accepted", "expired"]);
    }
  });

  it("keeps a candidate to one team per competition (PRD §16.2 no. 4)", async () => {
    const team = await freshTeam();
    const rival = await createTeam(outsider, team.competitionId, [
      { name: "UI/UX Designer", slots: 1 },
    ]);
    const mine = await sent(team, c1);
    const { data: theirs } = await outsider.db.rpc("send_invite", {
      p_team_role: rival.roleIds[0]!,
      p_candidate: c1.profileId,
      p_message: "Gabung ke kami?",
    });

    expect((await c1.db.rpc("accept_invite", { p_invite: mine })).error).toBeNull();
    expect((await c1.db.rpc("accept_invite", { p_invite: theirs! })).error?.message).toBe(
      "HAS_TEAM",
    );
  });

  it("lets only the candidate answer, and the sender cancel, while the invite is pending", async () => {
    const team = await freshTeam([
      { name: "UI/UX Designer", slots: 1 },
      { name: "Backend Developer", slots: 1 },
    ]);
    const inviteId = await sent(team, c1);

    expect((await outsider.db.rpc("accept_invite", { p_invite: inviteId })).error?.message).toBe(
      "FORBIDDEN",
    );
    expect((await leader.db.rpc("accept_invite", { p_invite: inviteId })).error?.message).toBe(
      "FORBIDDEN",
    );
    expect((await c1.db.rpc("cancel_invite", { p_invite: inviteId })).error?.message).toBe(
      "FORBIDDEN",
    );

    expect((await c1.db.rpc("decline_invite", { p_invite: inviteId })).error).toBeNull();
    expect(await status(inviteId)).toBe("declined");
    expect((await c1.db.rpc("decline_invite", { p_invite: inviteId })).error?.message).toBe(
      "NOT_PENDING",
    );
    expect((await c1.db.rpc("accept_invite", { p_invite: inviteId })).error?.message).toBe(
      "NOT_PENDING",
    );

    const second = await sent(team, c2, 1);
    expect((await leader.db.rpc("cancel_invite", { p_invite: second })).error).toBeNull();
    expect(await status(second)).toBe("cancelled");
    expect((await c2.db.rpc("accept_invite", { p_invite: second })).error?.message).toBe(
      "NOT_PENDING",
    );
  });

  it("refuses an invite older than 7 days", async () => {
    const team = await freshTeam();
    const inviteId = await sent(team, c1);
    await admin()
      .from("invites")
      .update({ created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() })
      .eq("id", inviteId);
    expect((await c1.db.rpc("accept_invite", { p_invite: inviteId })).error?.message).toBe(
      "NOT_PENDING",
    );
  });

  it("can't touch invites or team members straight through the API", async () => {
    const team = await freshTeam();
    const inviteId = await sent(team, c1);

    const forged = await c1.db
      .from("invites")
      .update({ status: "accepted" })
      .eq("id", inviteId)
      .select();
    expect(forged.data ?? []).toEqual([]);
    expect(await status(inviteId)).toBe("pending");

    const inserted = await c1.db.from("invites").insert({
      team_id: team.teamId,
      team_role_id: team.roleIds[0]!,
      candidate_id: c1.profileId,
      created_by: leader.profileId,
      direction: "invite",
    });
    expect(inserted.error).not.toBeNull();
  });

  it("doesn't let a student join a team on their own to read its contacts", async () => {
    const team = await freshTeam();
    const joined = await outsider.db.from("team_members").insert({
      team_id: team.teamId,
      competition_id: team.competitionId,
      profile_id: outsider.profileId,
      team_role_id: team.roleIds[0]!,
      is_leader: false,
    });
    expect(joined.error).not.toBeNull();

    const contacts = await outsider.db
      .from("profile_contacts")
      .select("whatsapp")
      .eq("profile_id", leader.profileId);
    expect(contacts.data).toEqual([]);
  });
});
