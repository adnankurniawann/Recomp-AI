/**
 * Inserts simulated profiles into Supabase (PRD §15).
 *
 *   pnpm seed:profiles              # 50 profiles
 *   pnpm seed:profiles --count 500  # performance test
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or .env.local.
 * Deletes every earlier simulated profile without an account first, so it can be run again.
 * Uses the service role key, so it is a local script only and never runs for a user (ADR 0003).
 */
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { generateProfiles } from "@/lib/seed/profiles";
import type { Database } from "@/lib/supabase/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { values } = parseArgs({ options: { count: { type: "string", default: "50" } } });
const count = Number(values.count);
if (!Number.isInteger(count) || count < 1 || count > 5000) {
  throw new Error(`--count must be a whole number from 1 to 5000, got "${values.count}"`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
}

const db = createClient<Database>(url, key, { auth: { persistSession: false } });

function check<T>(res: { data: T; error: { message: string } | null }, what: string) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

function rowsOf<T>(res: { data: T[] | null; error: { message: string } | null }, what: string) {
  return check(res, what) ?? [];
}

async function main() {
  const skills = rowsOf(await db.from("skills").select("id, slug"), "read skills");
  if (skills.length === 0) throw new Error("No skills found. Run `pnpm db:reset` first.");
  const competitions = rowsOf(await db.from("competitions").select("id"), "read competitions");

  const rows = generateProfiles({ count, skills, competitionIds: competitions.map((c) => c.id) });

  // Child rows go with the profiles (on delete cascade).
  check(
    await db.from("profiles").delete().eq("is_simulated", true).is("user_id", null),
    "delete old simulated profiles",
  );

  const tables = [
    ["profiles", rows.profiles],
    ["profile_contacts", rows.contacts],
    ["profile_skills", rows.skills],
    ["competition_history", rows.history],
    ["portfolio_items", rows.portfolio],
    ["competition_interests", rows.interests],
  ] as const;

  for (const [table, list] of tables) {
    for (let i = 0; i < list.length; i += 500) {
      // shortcut: the union of row types is too wide for .insert(); each list matches its table.
      check(await db.from(table).insert(list.slice(i, i + 500) as never), `insert ${table}`);
    }
    console.log(`${table}: ${list.length}`);
  }

  if (competitions.length === 0) {
    console.log("No competitions yet, so no interests were added. Run again after #8 seeds them.");
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
