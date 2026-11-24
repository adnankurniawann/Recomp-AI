import { expect, test } from "@playwright/test";
import { admin, createStudent, deleteStudents, type Student } from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// The core flow of PRD §16.3, on seed data with DEMO_MODE=true (issue #48). The ranking shows the
// seeded simulated students; one real student ("kandidat") is added so steps 6 and 7 can sign in.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

// A seeded hackathon whose registration is still open; hackathons have the most interested
// simulated students. supabase/seed.sql dates the simulated competitions from the day of
// `pnpm db:reset`. STACK 2026 itself closed on 7 Nov, so it has no "Buat tim".
async function openSeededCompetition() {
  const { data, error } = await admin()
    .from("competitions")
    .select("id, slug, name")
    .eq("is_published", true)
    .eq("category", "hackathon")
    .gte("registration_deadline", new Date().toISOString().slice(0, 10))
    .order("registration_deadline")
    .limit(1)
    .single();
  if (error || !data) throw new Error("No open seeded competition: run `pnpm db:reset`");
  return data;
}

test.describe.serial("core flow (PRD §16.3)", () => {
  let leader: Student;
  let candidate: Student;
  let teamId: string;
  let roleName: string;
  let competition: { slug: string; name: string; id: string };
  const candidateName = "Tes kandidatalur";

  test.beforeAll(async () => {
    [leader, candidate] = await Promise.all([
      createStudent("ketuaalur"),
      createStudent("kandidatalur", { goal: "win", work_time: "night", hours_per_week: 20 }),
    ]);
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

  test("3. opens an empty role tab and sees at least 3 candidates, scores falling", async ({
    page,
  }) => {
    // The real candidate wants this competition and has every required skill of the empty roles.
    const { data: roles } = await admin()
      .from("team_roles")
      .select("required_skills, team_members(profile_id)")
      .eq("team_id", teamId);
    const skills = new Set(
      (roles ?? [])
        .filter((r) => r.team_members.length === 0)
        .flatMap((r) => (r.required_skills as { skill_id: number }[]).map((x) => x.skill_id)),
    );
    await admin()
      .from("competition_interests")
      .insert({ profile_id: candidate.profileId, competition_id: competition.id });
    await admin()
      .from("profile_skills")
      .insert(
        [...skills].map((skill_id) => ({
          profile_id: candidate.profileId,
          skill_id,
          level: 4,
          evidence_url: "https://example.com/bukti",
        })),
      );

    await page.goto(`/tim/${teamId}`);
    const tabs = page.getByRole("tablist", { name: "Role kosong" }).getByRole("tab");
    const panel = page.getByRole("tabpanel");
    const badges = panel.getByRole("button", { name: /^Skor \d+ dari 100/ });
    let scores: number[] = [];
    for (let i = 0; i < (await tabs.count()); i++) {
      await tabs.nth(i).click();
      await expect(badges.first().or(panel.getByText("Belum ada kandidat"))).toBeVisible();
      const labels = await badges.evaluateAll((els) => els.map((e) => e.ariaLabel ?? ""));
      scores = labels.map((l) => Number(l.match(/\d+/)![0]));
      if (scores.length >= 3) {
        roleName = (await tabs.nth(i).innerText()).replace(/\d+$/, "").trim();
        break;
      }
    }
    expect(scores.length).toBeGreaterThanOrEqual(3);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test("4. opens the first candidate's profile sheet with history and portfolio", async ({
    page,
  }) => {
    await page.goto(`/tim/${teamId}`);
    await page.getByRole("tab", { name: new RegExp(roleName) }).click();
    const first = page.getByRole("tabpanel").getByRole("button", { name: /^Lihat profil / });
    const name = ((await first.first().getAttribute("aria-label")) ?? "").replace(
      "Lihat profil ",
      "",
    );
    await first.first().click();

    const sheet = page.getByRole("dialog", { name: `Profil ${name}` });
    await expect(sheet.getByRole("region", { name: `Kecocokan untuk ${roleName}` })).toBeVisible();
    await expect(sheet.getByText("Riwayat lomba", { exact: true })).toBeVisible();
    await expect(sheet.getByText("Portofolio", { exact: true })).toBeVisible();
  });

  test("5. invites the candidate from the ranking", async ({ page }) => {
    await page.goto(`/tim/${teamId}`);
    await page.getByRole("tab", { name: new RegExp(roleName) }).click();
    const panel = page.getByRole("tabpanel");
    const open = panel.getByRole("button", { name: `Lihat profil ${candidateName}` });
    await expect(panel.getByRole("button", { name: /^Lihat profil / }).first()).toBeVisible();
    while (!(await open.isVisible()))
      await panel.getByRole("button", { name: "Muat lagi" }).click();
    await open.click();

    const sheet = page.getByRole("dialog", { name: `Profil ${candidateName}` });
    await sheet.getByRole("button", { name: `Undang ${candidateName}` }).click();
    await page.getByRole("button", { name: "Kirim undangan" }).click();
    await expect(sheet.getByText("Menunggu respon")).toBeVisible();
  });

  test("6–7. the candidate accepts; the leader sees the contact and the role Terisi", async ({
    browser,
    baseURL,
    page,
  }) => {
    const asCandidate = await browser.newContext();
    await signIn(asCandidate, candidate, baseURL!);
    const candidatePage = await asCandidate.newPage();
    await candidatePage.goto("/undangan");
    const card = candidatePage
      .getByRole("listitem")
      .filter({ hasText: `mengajakmu jadi ${roleName}` });
    await card.getByRole("button", { name: "Terima" }).click();
    await expect(card.getByText("Diterima")).toBeVisible();
    await asCandidate.close();

    await page.goto(`/tim/${teamId}`);
    const role = page.getByRole("listitem").filter({ hasText: roleName }).first();
    await expect(role.getByText("Terisi")).toBeVisible();
    await expect(page.getByRole("link", { name: /Chat di WhatsApp/ }).first()).toBeVisible();
  });
});
