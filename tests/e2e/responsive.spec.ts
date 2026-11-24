import { expect, test, type Page } from "@playwright/test";
import {
  admin,
  createCompetition,
  createStudent,
  createTeam,
  deleteCompetition,
  deleteStudents,
} from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// Issue #49 and docs/agents/ui-review.md: at 360 px no page scrolls sideways and every control is
// at least 44 px tall and wide. Covers the pages that landed after the first pass (#90).
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");
test.use({ viewport: { width: 360, height: 800 } });

let competitionId: string;
let emptyCompetitionId: string;
test.afterAll(async () => {
  if (competitionId) await deleteCompetition(competitionId);
  if (emptyCompetitionId) await deleteCompetition(emptyCompetitionId);
  await deleteStudents();
});

/** Elements wider than the screen, and visible controls under 44 × 44 px (with their hit area). */
async function audit(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > width;
    const small: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [role=tab]",
    )) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
      if (el.closest("[aria-hidden=true], .sr-only, dialog:not([open])")) continue;
      if (el instanceof HTMLInputElement && ["checkbox", "radio", "file"].includes(el.type)) {
        const label = el.closest("label")?.getBoundingClientRect();
        if (label && label.height >= 44) continue;
      }
      // `tap-target` widens the hit area with ::after (app/globals.css).
      const after = getComputedStyle(el, "::after");
      const hit =
        after.content !== "none" && after.position === "absolute"
          ? {
              w: Math.max(r.width, parseFloat(after.width) || 0),
              h: Math.max(r.height, parseFloat(after.height) || 0),
            }
          : { w: r.width, h: r.height };
      if (hit.w < 44 || hit.h < 44) {
        const name = (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName).trim();
        small.push(`${name.slice(0, 40)} (${Math.round(hit.w)}×${Math.round(hit.h)})`);
      }
    }
    return { overflow, small };
  });
}

test("the pages added since the first pass fit 360 px with 44 px controls", async ({
  page,
  context,
  baseURL,
}) => {
  const boss = await createStudent("responsif");
  await admin().from("profiles").update({ app_role: "admin" }).eq("id", boss.profileId);
  competitionId = await createCompetition();
  // A second competition without a team, so /tim/baru shows the wizard instead of redirecting.
  emptyCompetitionId = await createCompetition();
  const { data: c } = await admin()
    .from("competitions")
    .select("slug")
    .eq("id", emptyCompetitionId)
    .single();
  const team = await createTeam(boss, competitionId, [{ name: "UI/UX Designer", slots: 2 }]);
  const { data: mentor } = await admin()
    .from("mentors")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();
  await signIn(context, boss, baseURL!);

  const pages = [
    `/tim/baru?lomba=${c!.slug}`,
    `/tim/${team.teamId}`,
    `/tim/${team.teamId}/role`,
    "/mentor",
    `/mentor/${mentor!.id}`,
    `/mentor/${mentor!.id}/checkout`,
    "/belajar/persiapan-hackathon/membaca-guidebook",
    "/admin/lomba",
    `/admin/lomba/${competitionId}`,
    "/admin/mentor",
    `/admin/mentor/${mentor!.id}`,
    "/admin/metrik",
  ];
  const problems: string[] = [];
  for (const path of pages) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    const { overflow, small } = await audit(page).catch(() => audit(page)); // one retry after a dev reload
    if (overflow) problems.push(`${path}: scrolls sideways`);
    for (const s of small) problems.push(`${path}: ${s}`);
  }
  expect(problems).toEqual([]);
});
