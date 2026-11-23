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
  const leader = await createStudent("ketua");
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

  await page.getByRole("main").getByText("UI/UX Designer", { exact: true }).click();
  await page.getByRole("button", { name: "Buat tim" }).click();
  await expect(page).toHaveURL(/\/tim\/[0-9a-f-]{36}$/);
  const teamId = page.url().split("/").pop()!;

  const db = admin();
  const { data: team } = await db.from("teams").select("name, goal").eq("id", teamId).single();
  expect(team).toEqual({ name: "Tim Uji", goal: "learn" });
  const { data: member } = await db
    .from("team_members")
    .select("team_roles(name)")
    .eq("team_id", teamId)
    .single();
  expect(member?.team_roles?.name).toBe("UI/UX Designer");

  await page.goto(`/tim/baru?lomba=${c!.slug}`);
  await expect(page).toHaveURL(new RegExp(`/tim/${teamId}$`));
  await context.close();
});
