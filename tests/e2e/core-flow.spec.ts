import { expect, test } from "@playwright/test";
import { admin, createStudent, deleteStudents, type Student } from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// The core flow of PRD §16.3, on seed data with DEMO_MODE=true (issue #48). Steps whose pages are not
// on main yet are marked fixme with the issue they wait for; remove the mark as each one lands.
// Steps 6 and 7 already run in invites.spec.ts on real invites.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

// A seeded competition whose registration is still open; supabase/seed.sql dates the simulated ones
// from the day of `pnpm db:reset`. STACK 2026 itself closed on 7 Nov, so it has no "Buat tim".
async function openSeededCompetition() {
  const { data, error } = await admin()
    .from("competitions")
    .select("slug, name")
    .eq("is_published", true)
    .gte("registration_deadline", new Date().toISOString().slice(0, 10))
    .order("registration_deadline")
    .limit(1)
    .single();
  if (error || !data) throw new Error("No open seeded competition: run `pnpm db:reset`");
  return data;
}

test.describe.serial("core flow (PRD §16.3)", () => {
  let leader: Student;
  let teamId: string;
  let competition: { slug: string; name: string };

  test.beforeAll(async () => {
    leader = await createStudent("ketuaalur");
    competition = await openSeededCompetition();
  });
  test.afterAll(async () => {
    if (teamId) await admin().from("teams").delete().eq("id", teamId);
    await deleteStudents();
  });
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, leader, baseURL!);
  });

  test("1. the leader opens /lomba and a seeded competition", async ({ page }) => {
    await page.goto("/lomba");
    await page.getByRole("link", { name: competition.name }).first().click();

    await expect(page).toHaveURL(new RegExp(`/lomba/${competition.slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(competition.name);
    await expect(page.getByRole("link", { name: "Buat tim" })).toBeVisible();
  });

  test("2. presses Buat tim, sees suggested roles, removes one and saves", async ({ page }) => {
    await page.goto(`/lomba/${competition.slug}`);
    await page.getByRole("link", { name: "Buat tim" }).click();
    await expect(page).toHaveURL(new RegExp(`/tim/baru\\?lomba=${competition.slug}`));

    await page.getByLabel("Nama tim").fill("Tim Ombak");
    await page.getByText("Juara", { exact: true }).click();
    await page.getByRole("button", { name: "Lanjut" }).click();

    await expect(page.getByRole("heading", { name: "Role yang dibutuhkan" })).toBeVisible();
    const removeButtons = page.getByRole("button", { name: /^Hapus role / });
    const suggested = await removeButtons.count();
    expect(suggested).toBeGreaterThan(1);

    // PRD §16.3 step 2: remove one suggested role. Remove more only if the slots are over team_max.
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(suggested - 1);
    const next = page.getByRole("button", { name: "Lanjut" });
    while ((await next.isDisabled()) && (await removeButtons.count()) > 1) {
      await removeButtons.first().click();
    }
    const kept = await removeButtons.count();
    await next.click();

    await expect(page.getByRole("heading", { name: "Role kamu" })).toBeVisible();
    await page.getByRole("button", { name: "Buat tim" }).click();
    await expect(page).toHaveURL(/\/tim\/[0-9a-f-]{36}$/);
    teamId = page.url().split("/").pop()!;

    const { data: team } = await admin()
      .from("teams")
      .select("name, goal, leader_id, team_roles(id), team_members(profile_id, is_leader)")
      .eq("id", teamId)
      .single();
    expect(team).toMatchObject({ name: "Tim Ombak", goal: "win", leader_id: leader.profileId });
    expect(team?.team_roles).toHaveLength(kept);
    expect(team?.team_members).toEqual([{ profile_id: leader.profileId, is_leader: true }]);
  });

  test.fixme("3. opens an empty role tab and sees at least 3 candidates, scores falling (#26, #28, #29)", async () => {});
  test.fixme("4. opens the first candidate's profile sheet with history and portfolio (#30)", async () => {});
  test.fixme("5. invites the candidate from the ranking (#29 places InviteButton)", async () => {});
  test.fixme("6–7. the candidate accepts; the leader sees the contact and the role Terisi (#26, #34)", async () => {});
});
