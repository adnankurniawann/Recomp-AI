import { expect, test } from "@playwright/test";
import {
  admin,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
  type Student,
} from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// F-INV-02, F-INV-03 and PRD §16.3 steps 6 and 7, from the candidate's and the leader's side.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

const competitions: string[] = [];
test.afterAll(async () => {
  for (const id of competitions) await deleteCompetition(id);
  await deleteStudents();
});

async function invited(leader: Student, candidate: Student) {
  const competitionId = await createCompetition();
  competitions.push(competitionId);
  const team = await createTeam(leader, competitionId, [{ name: "UI/UX Designer", slots: 1 }]);
  const { data: inviteId, error } = await leader.db.rpc("send_invite", {
    p_team_role: team.roleIds[0]!,
    p_candidate: candidate.profileId,
    p_message: "Halo, kami lagi cari UI/UX Designer. Mau gabung?",
  });
  if (error) throw new Error(error.message);
  return { ...team, inviteId: inviteId! };
}

test("the candidate accepts on /undangan, joins the role, and contacts open", async ({
  browser,
  baseURL,
}) => {
  const [leader, candidate] = await Promise.all([
    createStudent("ketua"),
    createStudent("kandidat"),
  ]);
  const team = await invited(leader, candidate);

  const asCandidate = await browser.newContext();
  await signIn(asCandidate, candidate, baseURL!);
  const page = await asCandidate.newPage();
  await page.goto("/undangan");

  const card = page.getByRole("listitem").filter({ hasText: "mengajakmu jadi UI/UX Designer" });
  await expect(card.getByText("Menunggu respon")).toBeVisible();
  await expect(card.getByText("Halo, kami lagi cari UI/UX Designer. Mau gabung?")).toBeVisible();
  await card.getByRole("button", { name: "Terima" }).click();
  await expect(page.getByText(/Kamu sekarang anggota Tim/)).toBeVisible();
  await expect(card.getByText("Diterima")).toBeVisible();

  const { data: member } = await admin()
    .from("team_members")
    .select("team_role_id")
    .eq("team_id", team.teamId)
    .eq("profile_id", candidate.profileId)
    .single();
  expect(member?.team_role_id).toBe(team.roleIds[0]);

  // Step 7: the leader can now read the candidate's contact (the dashboard shows it, #34).
  const contact = await leader.db
    .from("profile_contacts")
    .select("whatsapp")
    .eq("profile_id", candidate.profileId);
  expect(contact.data).toHaveLength(1);

  // The leader sees the answer on the sent tab.
  const asLeader = await browser.newContext();
  await signIn(asLeader, leader, baseURL!);
  const leaderPage = await asLeader.newPage();
  await leaderPage.goto("/undangan?tab=terkirim");
  await expect(
    leaderPage.getByRole("listitem").filter({ hasText: "Tes kandidat" }).getByText("Diterima"),
  ).toBeVisible();

  await asCandidate.close();
  await asLeader.close();
});

test("declining asks once more, then marks the invite as declined", async ({
  page,
  context,
  baseURL,
}) => {
  const [leader, candidate] = await Promise.all([
    createStudent("ketua2"),
    createStudent("kandidat2"),
  ]);
  await invited(leader, candidate);
  await signIn(context, candidate, baseURL!);

  await page.goto("/undangan");
  const card = page.getByRole("listitem").filter({ hasText: "mengajakmu jadi UI/UX Designer" });
  await card.getByRole("button", { name: "Tolak" }).click();
  await expect(card.getByText("Tolak undangan ini?")).toBeVisible();
  await card.getByRole("button", { name: "Ya, tolak" }).click();
  await expect(page.getByText("Undangan ditolak")).toBeVisible();
  await expect(card.getByText("Ditolak")).toBeVisible();
});
