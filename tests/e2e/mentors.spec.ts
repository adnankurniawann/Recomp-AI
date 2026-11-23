import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { admin } from "../integration/supabase";
import { hasLocalDb } from "./helpers";

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
});

test.afterAll(async () => {
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
