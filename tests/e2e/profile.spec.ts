import { expect, test } from "@playwright/test";
import { admin, createStudent, deleteStudents } from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// F-PRF-01, F-PRF-06, F-PRF-07: onboarding, editing and the public profile in a real browser.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");
test.afterAll(deleteStudents);

test("a new student finishes the four onboarding steps and lands on /lomba", async ({
  page,
  context,
  baseURL,
}) => {
  const student = await createStudent("baru", {}, { onboarded: false });
  await signIn(context, student, baseURL!);
  const username = `e2e_${Date.now() % 1e8}`;

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Data diri" })).toBeVisible();
  await page.getByLabel("Nama lengkap").fill("Dinda Putri");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Kampus").fill("Institut Contoh");
  await page.getByLabel("Jurusan").fill("DKV");
  await page.getByLabel("Angkatan").fill("2024");
  await page.getByRole("button", { name: "Lanjut" }).click();

  // Step 2: "Lanjut" stays off until there is a role and three skills (F-PRF-01).
  await expect(page.getByRole("heading", { name: "Role dan skill" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut" })).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText(/^Pilih minimal 1 role yang kamu minati\.?$/);
  await page.getByRole("button", { name: "UI/UX", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(/^Pilih minimal 3 skill\.?$/);

  const suggestions = page.locator("div.bg-wash").getByRole("button");
  await expect(suggestions.first()).toHaveText("Figma");
  for (const skill of ["Figma", "User Research", "Prototyping"]) {
    await suggestions.filter({ hasText: skill }).click();
  }
  await page.getByRole("button", { name: "Lanjut" }).click();

  // Step 3: one competition history item.
  await expect(page.getByRole("heading", { name: "Riwayat dan portofolio" })).toBeVisible();
  await page.getByRole("button", { name: "Tambah riwayat lomba" }).click();
  await page.getByLabel("Nama lomba").fill("Hackathon Kampus");
  await page.getByLabel("Kategori").selectOption("hackathon");
  await page.getByLabel("Hasil").selectOption("finalist");
  await page.getByRole("button", { name: "Lanjut" }).click();

  // Step 4: WhatsApp is normalised to +62.
  await expect(page.getByRole("heading", { name: "Kontak dan preferensi" })).toBeVisible();
  await page.getByLabel("WhatsApp").fill("0812 3456 7890");
  await page.getByLabel("Jam tersedia per minggu").fill("6");
  await page.getByText("Juara", { exact: true }).click();
  await page.getByText("Malam", { exact: true }).click();
  await page.getByRole("button", { name: "Selesai" }).click();

  await expect(page).toHaveURL(/\/lomba$/);

  const { data: profile } = await admin()
    .from("profiles")
    .select("onboarding_done, username, preferred_roles, goal, work_time")
    .eq("id", student.profileId)
    .single();
  expect(profile).toMatchObject({
    onboarding_done: true,
    username,
    preferred_roles: ["uiux"],
    goal: "win",
    work_time: "night",
  });
  const { data: contact } = await admin()
    .from("profile_contacts")
    .select("whatsapp")
    .eq("profile_id", student.profileId)
    .single();
  expect(contact?.whatsapp).toBe("+6281234567890");
});

test("a student edits their bio and the public profile shows it without contacts", async ({
  page,
  context,
  baseURL,
}) => {
  const student = await createStudent("ubah");
  await signIn(context, student, baseURL!);

  await page.goto("/profil");
  await page.getByLabel("Bio").fill("Suka riset pengguna dan prototyping.");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan")).toBeVisible();

  await page.goto(`/u/${student.username}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Tes ubah`);
  await expect(page.getByText("Suka riset pengguna dan prototyping.")).toBeVisible();
  await expect(page.getByText("Data diisi oleh pengguna")).toBeVisible();
  expect(await page.content()).not.toContain("+628");
});

test("an unknown username shows the Indonesian not-found page", async ({ page }) => {
  await page.goto("/u/tidak_ada_orangnya");
  await expect(page.getByText("Profil tidak ditemukan")).toBeVisible();
});
