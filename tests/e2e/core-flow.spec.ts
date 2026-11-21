import { expect, test } from "@playwright/test";
import { createStudent, deleteStudents } from "../integration/supabase";
import { hasLocalDb, signIn } from "./helpers";

// The core flow of PRD §16.3, on seed data with DEMO_MODE=true (issue #48). Steps whose pages are not
// on main yet are marked fixme with the issue they wait for; remove the mark as each one lands.
// Steps 6 and 7 already run in invites.spec.ts on real invites.
test.skip(!hasLocalDb, "needs local Supabase (see CONTRIBUTING.md)");
test.afterAll(deleteStudents);

test.describe.serial("core flow (PRD §16.3)", () => {
  test("1a. the leader signs in and sees the seeded competitions on /lomba", async ({
    page,
    context,
    baseURL,
  }) => {
    const leader = await createStudent("ketuaalur");
    await signIn(context, leader, baseURL!);

    await page.goto("/lomba");
    // STACK 2026 is seeded by supabase/seed.sql (#8, PR #74).
    await expect(page.getByText("STACK 2026").first()).toBeVisible();
  });

  test.fixme("1b. opens the competition's page /lomba/[slug] (#17)", async () => {});
  test.fixme("2. presses Buat tim, sees suggested roles, removes one and saves (#24, #25)", async () => {});
  test.fixme("3. opens an empty role tab and sees at least 3 candidates, scores falling (#28, #29)", async () => {});
  test.fixme("4. opens the first candidate's profile sheet with history and portfolio (#30)", async () => {});
  test.fixme("5. invites the candidate from the ranking (#29 places InviteButton)", async () => {});
  test.fixme("6–7. the candidate accepts; the leader sees the contact and the role Terisi (#26, #34)", async () => {});
});
