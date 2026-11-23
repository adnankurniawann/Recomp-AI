import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildRankingPage, RankingSource } from "@/lib/ranking/build";
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
  type TestTeam,
} from "./supabase";

const FIGMA = 16; // the required skill of every role createTeam makes
const PYTHON = 22;

// F-RNK-01 and F-RNK-04: ranking_candidates (migration 0012) applies filters 1–6 of PRD §7.2.
describe.skipIf(!hasLocalDb)("ranking_candidates", () => {
  let competitionId: string;
  let team: TestTeam;
  const s: Record<string, Student> = {};

  const interested = (p: Student, competition = competitionId) =>
    admin()
      .from("competition_interests")
      .insert({ profile_id: p.profileId, competition_id: competition });
  const skill = (p: Student, skillId = FIGMA, evidence: string | null = null) =>
    admin()
      .from("profile_skills")
      .insert({ profile_id: p.profileId, skill_id: skillId, level: 3, evidence_url: evidence });

  beforeAll(async () => {
    const labels = [
      "ketua",
      "anggota",
      "luar",
      "cocok",
      "bukti",
      "taktertarik",
      "tertutup",
      "baru",
      "bertim",
      "menolak",
      "menunggu",
      "tanpaskill",
    ] as const;
    const made = await Promise.all(
      labels.map((l) =>
        createStudent(l, l === "tertutup" ? { open_to_invite: false } : {}, {
          onboarded: l !== "baru",
        }),
      ),
    );
    labels.forEach((l, i) => (s[l] = made[i]!));

    competitionId = await createCompetition();
    team = await createTeam(s.ketua!, competitionId, [{ name: "UI/UX Designer", slots: 1 }]);
    await addMember(team.teamId, competitionId, s.anggota!.profileId, null);

    // Everyone below wants this competition and has Figma, unless the label says otherwise.
    for (const l of labels) {
      if (["ketua", "anggota", "luar", "taktertarik"].includes(l)) continue;
      await interested(s[l]!);
      if (l !== "tanpaskill")
        await skill(s[l]!, FIGMA, l === "bukti" ? "https://example.com/a" : null);
    }
    await skill(s.taktertarik!);
    await skill(s.tanpaskill!, PYTHON);

    // bertim: already in another team for the same competition (filter 3).
    const other = await createTeam(s.luar!, competitionId, [{ name: "Backend", slots: 1 }]);
    await addMember(other.teamId, competitionId, s.bertim!.profileId, null);

    // menolak: declined this team before; menunggu: has a pending invite from it (filter 5).
    for (const l of ["menolak", "menunggu"] as const) {
      const { error } = await s.ketua!.db.rpc("send_invite", {
        p_team_role: team.roleIds[0]!,
        p_candidate: s[l]!.profileId,
        p_message: "Halo!",
      });
      if (error) throw new Error(error.message);
    }
    const { data: inv } = await admin()
      .from("invites")
      .select("id")
      .eq("candidate_id", s.menolak!.profileId)
      .single();
    await s.menolak!.db.rpc("decline_invite", { p_invite: inv!.id });
  });

  afterAll(async () => {
    await deleteCompetition(competitionId);
    await deleteStudents();
  });

  it("returns only students who pass filters 1 to 7", async () => {
    const { data, error } = await s.ketua!.db.rpc("ranking_candidates", {
      p_team_role: team.roleIds[0]!,
    });
    expect(error).toBeNull();
    const source = RankingSource.parse(data);
    const ids = source.candidates.map((c) => c.id).sort();
    expect(ids).toEqual([s.cocok!.profileId, s.bukti!.profileId].sort());
    expect(source.role.name).toBe("UI/UX Designer");
    expect(source.config?.weights.coverage).toBeCloseTo(0.4);
    expect(source.skill_names).toContainEqual({ id: FIGMA, name: "Figma" });
  });

  it("scores and orders them in TypeScript, evidence first on a tie", async () => {
    const { data } = await s.ketua!.db.rpc("ranking_candidates", {
      p_team_role: team.roleIds[0]!,
    });
    const page = buildRankingPage(RankingSource.parse(data), { limit: 20, offset: 0 });
    expect(page.total).toBe(2);
    expect(page.candidates[0]!.profile.id).toBe(s.bukti!.profileId);
    expect(page.candidates[0]!.score).toBeGreaterThan(page.candidates[1]!.score);
  });

  it("never carries contacts", async () => {
    const { data } = await s.ketua!.db.rpc("ranking_candidates", {
      p_team_role: team.roleIds[0]!,
    });
    const json = JSON.stringify(data);
    expect(json).not.toContain("whatsapp");
    expect(json).not.toContain("contact_email");
  });

  it("works for any team member, not only the leader", async () => {
    const { error } = await s.anggota!.db.rpc("ranking_candidates", {
      p_team_role: team.roleIds[0]!,
    });
    expect(error).toBeNull();
  });

  it("refuses outsiders, unknown roles and signed-out callers", async () => {
    const outsider = await s.luar!.db.rpc("ranking_candidates", { p_team_role: team.roleIds[0]! });
    expect(outsider.error?.message).toBe("NOT_MEMBER");

    const unknown = await s.ketua!.db.rpc("ranking_candidates", {
      p_team_role: "00000000-0000-0000-0000-000000000000",
    });
    expect(unknown.error?.message).toBe("ROLE_NOT_FOUND");

    const signedOut = await anon().rpc("ranking_candidates", { p_team_role: team.roleIds[0]! });
    expect(signedOut.error).not.toBeNull();
    expect(signedOut.data).toBeNull();
  });
});
