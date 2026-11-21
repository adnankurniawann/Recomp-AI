"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { loadPublicProfile, type PublicProfile } from "@/lib/profile/public";

const username = z.string().regex(/^[a-z0-9_]{3,20}$/i);

/**
 * The public profile for the ProfileSheet on the ranking (F-RNK-03). Same data and the same rules
 * as `/u/[username]`: public columns only, contacts never (ADR 0003).
 */
export async function loadProfileForSheet(input: string): Promise<ActionResult<PublicProfile>> {
  const parsed = username.safeParse(input);
  if (!parsed.success) return fail("NOT_FOUND", "Profil ini tidak ditemukan.");
  try {
    const profile = await loadPublicProfile(parsed.data);
    return profile ? ok(profile) : fail("NOT_FOUND", "Profil ini tidak ditemukan.");
  } catch (e) {
    console.error("profile sheet", e instanceof Error ? e.message : e);
    return fail("UNKNOWN");
  }
}
