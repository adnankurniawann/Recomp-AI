import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { admin, createStudent, deleteStudents } from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// F-CMP-04, F-ADM-01: the admin adds a competition, uploads its guidebook, approves an extraction
// and manages mentors.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

const slug = `admin-e2e-${randomUUID().slice(0, 8)}`;
const mentorName = `Mentor E2E ${randomUUID().slice(0, 6)}`;

test.afterAll(async () => {
  const { data: c } = await admin()
    .from("competitions")
    .select("id, guidebook_path")
    .eq("slug", slug)
    .maybeSingle();
  if (c?.guidebook_path) await admin().storage.from("guidebooks").remove([c.guidebook_path]);
  if (c) await admin().from("competitions").delete().eq("id", c.id);
  await admin().from("mentors").delete().eq("display_name", mentorName);
  await deleteStudents();
});

test("students get a 404 on /admin", async ({ browser, baseURL }) => {
  const student = await createStudent("biasa");
  const context = await browser.newContext();
  await signIn(context, student, baseURL!);
  const page = await context.newPage();
  const res = await page.goto("/admin/lomba");
  expect(res?.status()).toBe(404);
  await context.close();
});

test("the admin adds a competition, uploads a guidebook and approves the extraction", async ({
  browser,
  baseURL,
}) => {
  const boss = await createStudent("admin");
  await admin().from("profiles").update({ app_role: "admin" }).eq("id", boss.profileId);

  const context = await browser.newContext();
  await signIn(context, boss, baseURL!);
  const page = await context.newPage();
  await page.goto("/admin/lomba/baru");

  await page.getByLabel("Nama lomba").fill("Hackathon Admin E2E");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Penyelenggara").fill("Panitia Uji");
  await page.getByLabel("Maksimal anggota tim").fill("4");
  await page.getByRole("button", { name: "Tambah lomba" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hackathon Admin E2E" })).toBeVisible();
  const competitionId = page.url().split("/").pop()!;

  // A wrong file type is refused before upload; a PDF goes to the bucket.
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "x.png", mimeType: "image/png", buffer: Buffer.from("png") });
  await expect(page.getByText("Guidebook harus file PDF.")).toBeVisible();
  await input.setInputFiles({
    name: "guidebook.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF\n"),
  });
  await expect(page.getByRole("button", { name: "Jalankan ekstraksi" })).toBeEnabled();

  const { data: c } = await admin()
    .from("competitions")
    .select("guidebook_path")
    .eq("id", competitionId)
    .single();
  expect(c?.guidebook_path).toMatch(new RegExp(`^${competitionId}/\\d+\\.pdf$`));

  // The agent needs Gemini; a draft stands in for its result here.
  const { data: x } = await admin()
    .from("competition_extractions")
    .insert({
      competition_id: competitionId,
      status: "draft",
      data: {
        summary: "Ringkasan dari AI.",
        team_size: { min: 2, max: 4, page: 1 },
        deadlines: [{ name: "Pendaftaran", date: "2026-12-01", page: 1 }],
        judging_criteria: [{ name: "Desain", weight_percent: 30, page: 2 }],
        suggested_roles: [],
        warnings: [],
        guidebook_path: c!.guidebook_path,
        roles: [
          {
            name: "Backend Developer",
            colorKey: "backend",
            source: "guidebook",
            sourcePage: 2,
            sourceCriterion: null,
            edited: false,
            requiredSkills: [{ skillId: 1, minLevel: 2 }],
            optionalSkillIds: [],
            hoursPerWeek: 8,
            slots: 2,
            reason: "Butuh API",
            unmatchedSkills: [],
          },
        ],
      },
    })
    .select("id")
    .single();

  await page.reload();
  await page.getByRole("link", { name: "Review hasil" }).click();
  await expect(page).toHaveURL(new RegExp(`/ekstraksi/${x!.id}$`));
  await page.getByLabel("Ringkasan lomba").fill("Ringkasan yang sudah dicek admin.");
  await page.getByRole("button", { name: "Simpan dan setujui" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/lomba/${competitionId}$`));

  const { data: reviewed } = await admin()
    .from("competition_extractions")
    .select("status, reviewed_by, data")
    .eq("id", x!.id)
    .single();
  expect(reviewed?.status).toBe("reviewed");
  expect(reviewed?.reviewed_by).toBe(boss.profileId);
  expect((reviewed?.data as { summary: string }).summary).toBe("Ringkasan yang sudah dicek admin.");
  await context.close();
});

test("the admin adds a mentor with a service and hides them again", async ({
  browser,
  baseURL,
}) => {
  const boss = await createStudent("adminmentor");
  await admin().from("profiles").update({ app_role: "admin" }).eq("id", boss.profileId);
  const context = await browser.newContext();
  await signIn(context, boss, baseURL!);
  const page = await context.newPage();

  await page.goto("/admin/mentor");
  await page.getByRole("link", { name: "Tambah mentor" }).click();
  await page.getByRole("button", { name: "Tambah mentor" }).click();
  await expect(page.getByText("Pilih minimal 1 role")).toBeVisible();

  await page.getByLabel("Nama", { exact: true }).fill(mentorName);
  await page.getByLabel("Kredensial").fill("Juara 1 hackathon uji 2025");
  await page.getByRole("group", { name: "Role" }).getByLabel("UI/UX").check();
  await page.getByLabel("Nama layanan").fill("Review pitch deck");
  await page.getByLabel("Harga (Rp)").fill("90000");
  await page.getByRole("button", { name: "Tambah mentor" }).click();
  await expect(page.getByRole("heading", { level: 1, name: mentorName })).toBeVisible();

  await page.goto("/mentor");
  await expect(page.getByText(mentorName)).toBeVisible();

  await page.goto("/admin/mentor");
  await page.getByRole("link", { name: mentorName }).click();
  await page.getByLabel("Tampilkan di /mentor").uncheck();
  await page.getByRole("button", { name: "Simpan mentor" }).click();
  await expect(page.getByText("Mentor sudah disimpan.")).toBeVisible();
  await page.goto("/mentor");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText(mentorName)).toHaveCount(0);
  await context.close();
});
