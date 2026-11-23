import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  admin,
  createCompetition,
  createStudent,
  deleteCompetition,
  deleteStudents,
} from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// F-MNT-01: the mentor grid /mentor, its role filter and price sort.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");

const tag = randomUUID().slice(0, 6);
const mentors = [
  { id: randomUUID(), name: `Mentor Desain ${tag}`, roles: ["uiux"], price: 90_000 },
  { id: randomUUID(), name: `Mentor Backend ${tag}`, roles: ["backend"], price: 50_000 },
];

test.beforeAll(async () => {
  const db = admin();
  const { error } = await db.from("mentors").insert(
    mentors.map((m) => ({
      id: m.id,
      display_name: m.name,
      roles: m.roles,
      headline: "Juara 1 lomba uji",
      competition_categories: ["hackathon" as const],
      is_simulated: true,
    })),
  );
  if (error) throw new Error(error.message);
  const { error: sErr } = await db
    .from("mentor_services")
    .insert(
      mentors.map((m) => ({ mentor_id: m.id, name: "Sesi uji", duration_min: 30, price: m.price })),
    );
  if (sErr) throw new Error(sErr.message);
  const { error: cErr } = await db
    .from("mentor_contacts")
    .insert({ mentor_id: mentors[0]!.id, whatsapp: "+6281299990000" });
  if (cErr) throw new Error(cErr.message);
  const { error: slotErr } = await db
    .from("mentor_slots")
    .insert({
      mentor_id: mentors[0]!.id,
      starts_at: new Date(Date.now() + 2 * 864e5).toISOString(),
    });
  if (slotErr) throw new Error(slotErr.message);
});

const competitions: string[] = [];

test.afterAll(async () => {
  await admin()
    .from("bookings")
    .delete()
    .in(
      "mentor_id",
      mentors.map((m) => m.id),
    );
  for (const id of competitions) await deleteCompetition(id);
  await deleteStudents();
  await admin()
    .from("mentors")
    .delete()
    .in(
      "id",
      mentors.map((m) => m.id),
    );
});

test("visitors filter mentors by role and open one", async ({ page }) => {
  await page.goto("/mentor");
  const design = page.getByRole("link", { name: mentors[0]!.name });
  const backend = page.getByRole("link", { name: mentors[1]!.name });
  await expect(design).toBeVisible();
  await expect(backend).toBeVisible();
  await expect(page.getByText("Mulai dari Rp50.000")).toBeVisible();

  await page
    .getByRole("group", { name: "Filter role" })
    .getByRole("button", { name: "UI/UX" })
    .click();
  await expect(page).toHaveURL(/peran=uiux/);
  await expect(backend).toHaveCount(0);
  await expect(design).toBeVisible();

  await design.click();
  await expect(page).toHaveURL(new RegExp(`/mentor/${mentors[0]!.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: mentors[0]!.name })).toBeVisible();
});

test("price sort puts the cheapest first", async ({ page }) => {
  await page.goto("/mentor?urut=harga");
  const names = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(names.indexOf(mentors[1]!.name)).toBeLessThan(names.indexOf(mentors[0]!.name));
});

test("a team member books, pays (simulated) and sees the session on the team page", async ({
  browser,
  baseURL,
}) => {
  const member = await createStudent("anggota");
  const competitionId = await createCompetition();
  competitions.push(competitionId);
  const { data: teamId, error } = await member.db.rpc("create_team", {
    p_competition: competitionId,
    p_name: "Tim Mentor",
    p_goal: "win",
    p_work_time: "night",
    p_roles: [
      {
        name: "Backend",
        color_key: "backend",
        source: "manual",
        source_page: null,
        source_criterion: null,
        edited: false,
        required_skills: [{ skill_id: 1, min_level: 2 }],
        optional_skill_ids: [],
        hours_per_week: 8,
        slots: 1,
      },
    ] as never,
    p_leader_role_index: 0,
  });
  if (error) throw new Error(error.message);

  const context = await browser.newContext();
  await signIn(context, member, baseURL!);
  const page = await context.newPage();
  await page.goto(`/mentor/${mentors[0]!.id}`);
  await page.getByRole("button", { name: "Hubungkan dengan mentor" }).click();

  await expect(page).toHaveURL(/\/checkout\?booking=/);
  await expect(
    page.getByText("Ini pembayaran simulasi. Tidak ada uang yang ditarik."),
  ).toBeVisible();
  await expect(page.getByText("Rp18.000")).toBeVisible(); // 20% of Rp90.000
  await expect(page.getByText("Rp72.000")).toBeVisible();
  await page.getByRole("button", { name: "Bayar (Simulasi)" }).click();

  await expect(page).toHaveURL(new RegExp(`/tim/${teamId}$`));
  await expect(page.getByText("Dibayar (Simulasi)")).toBeVisible();
  await expect(page.getByRole("link", { name: "Chat mentor di WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/6281299990000",
  );
  await context.close();
});
