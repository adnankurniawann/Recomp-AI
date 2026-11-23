import { expect, test } from "@playwright/test";
import {
  admin,
  createCompetition,
  createStudent,
  deleteCompetition,
  deleteStudents,
} from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// F-TEM-01: the three-step wizard on /tim/baru, the slot limit and the redirect once a team exists.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

const competitions: string[] = [];
test.afterAll(async () => {
  for (const id of competitions) await deleteCompetition(id);
  await deleteStudents();
});

test("the leader creates a team from the template roles", async ({ browser, baseURL }) => {
  const [leader, friend] = await Promise.all([createStudent("ketua"), createStudent("teman")]);
  const competitionId = await createCompetition();
  competitions.push(competitionId);
  const { data: c } = await admin()
    .from("competitions")
    .select("slug")
    .eq("id", competitionId)
    .single();

  const context = await browser.newContext();
  await signIn(context, leader, baseURL!);
  const page = await context.newPage();
  await page.goto(`/tim/baru?lomba=${c!.slug}`);

  await page.getByLabel("Nama tim").fill("Tim Uji");
  await page.getByRole("main").getByText("Belajar", { exact: true }).click();
  await page.getByRole("button", { name: "Lanjut" }).click();

  // The five hackathon templates hold 5 slots, over team_max 4.
  await expect(page.getByText("Total slot melebihi batas tim lomba (maks. 4)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut" })).toBeDisabled();
  await page.getByRole("button", { name: "Hapus role Product dan Pitching" }).click();
  await page.getByRole("button", { name: "Lanjut" }).click();

  await page.getByRole("group", { name: "Role kamu" }).getByText("UI/UX Designer").click();
  // Step 3 invites: an unknown username is refused, a real one is listed.
  await page.getByLabel("Username").fill("belum_ada_orangnya");
  await page.getByRole("button", { name: "Tambah" }).click();
  await expect(page.getByText("Username ini belum terdaftar di Recomp AI.")).toBeVisible();
  await page.getByLabel("Username").fill(friend.username);
  await page.getByLabel("Role untuk teman ini").selectOption({ label: "Backend Developer" });
  await page.getByRole("button", { name: "Tambah" }).click();
  await expect(page.getByText(`@${friend.username}`)).toBeVisible();

  await page.getByRole("button", { name: "Buat tim" }).click();
  await expect(page).toHaveURL(/\/tim\/[0-9a-f-]{36}$/);
  const teamId = page.url().split("/").pop()!;

  // F-TEM-03: the dashboard the wizard lands on.
  await expect(page.getByRole("heading", { level: 1, name: "Tim Uji" })).toBeVisible();
  await expect(page.getByText("Sedang mencari")).toBeVisible();
  await expect(page.getByText("Skill wajib yang belum tertutup:")).toBeVisible();
  await expect(page.getByText("Menunggu respon", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lihat kandidat" })).toHaveCount(3);

  // assignMemberRole: the leader moves themself to Frontend Developer.
  await page
    .getByRole("combobox", { name: /^Role / })
    .selectOption({ label: "Frontend Developer" });
  await expect(page.getByText(/dipindah ke Frontend Developer/)).toBeVisible();

  const db = admin();
  const { data: team } = await db.from("teams").select("name, goal").eq("id", teamId).single();
  expect(team).toEqual({ name: "Tim Uji", goal: "learn" });
  const { data: member } = await db
    .from("team_members")
    .select("team_roles(name)")
    .eq("team_id", teamId)
    .single();
  expect(member?.team_roles?.name).toBe("Frontend Developer");

  const { data: invite } = await db
    .from("invites")
    .select("status, team_roles(name)")
    .eq("team_id", teamId)
    .eq("candidate_id", friend.profileId)
    .single();
  expect(invite).toEqual({ status: "pending", team_roles: { name: "Backend Developer" } });

  await page.goto(`/tim/baru?lomba=${c!.slug}`);
  await expect(page).toHaveURL(new RegExp(`/tim/${teamId}$`));
  await context.close();
});

test("the leader edits roles and confirms a change to a filled role", async ({
  browser,
  baseURL,
}) => {
  const leader = await createStudent("ketua");
  const competitionId = await createCompetition();
  competitions.push(competitionId);
  const role = (name: string) => ({
    name,
    color_key: "frontend",
    source: "template",
    source_page: null,
    source_criterion: null,
    edited: false,
    required_skills: [{ skill_id: 1, min_level: 2 }],
    optional_skill_ids: [],
    hours_per_week: 8,
    slots: 1,
  });
  const { data: teamId, error } = await leader.db.rpc("create_team", {
    p_competition: competitionId,
    p_name: "Tim Edit",
    p_goal: "win",
    p_work_time: "night",
    p_roles: [role("Frontend Developer")] as never,
    p_leader_role_index: 0,
  });
  if (error) throw new Error(error.message);

  const context = await browser.newContext();
  await signIn(context, leader, baseURL!);
  const page = await context.newPage();

  // One role, one slot, filled by the leader: the dashboard shows the complete card.
  await page.goto(`/tim/${teamId}`);
  await expect(page.getByText("Semua role sudah terisi")).toBeVisible();
  await expect(page.getByRole("link", { name: "Lihat kandidat" })).toHaveCount(0);

  await page.getByRole("link", { name: "Edit role" }).click();
  await expect(page).toHaveURL(new RegExp(`/tim/${teamId}/role$`));

  // The leader's role has a member, so it can't be deleted.
  await expect(page.getByRole("button", { name: "Hapus role Frontend Developer" })).toBeDisabled();

  await page.getByRole("button", { name: "Tambah role" }).click();
  await page.getByRole("button", { name: "Kosong", exact: true }).click();
  await page.locator("#role-1-name").fill("Backend Developer");
  await page.locator("#role-1-add-required").selectOption({ label: "Node.js" });
  await page.locator("#role-0-name").fill("Frontend Engineer");

  await page.getByRole("button", { name: "Simpan role" }).click();
  await expect(page.getByText("Role Frontend Engineer sudah punya anggota")).toBeVisible();
  await page.getByRole("button", { name: "Ya, simpan" }).click();
  await expect(page).toHaveURL(new RegExp(`/tim/${teamId}$`));
  await expect(page.getByText("Skill wajib yang belum tertutup:")).toContainText("Node.js");

  const { data: roles } = await admin()
    .from("team_roles")
    .select("name, source, edited")
    .eq("team_id", teamId!)
    .order("sort");
  expect(roles).toEqual([
    { name: "Frontend Engineer", source: "template", edited: true },
    { name: "Backend Developer", source: "manual", edited: false },
  ]);
  await context.close();
});
