"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, failFromDb, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";

/**
 * Mark or unmark a competition as "Tertarik" (F-CMP-03). Only interested students reach that
 * competition's ranking. Returns the new state and the fresh interest count.
 */
export async function toggleInterest(
  competitionId: string,
): Promise<ActionResult<{ interested: boolean; count: number }>> {
  const parsed = z.object({ competitionId: uuid }).safeParse({ competitionId });
  if (!parsed.success) return fail("VALIDATION");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  const { data: profileId } = await supabase.rpc("current_profile_id");
  if (!profileId) return fail("AUTH_REQUIRED");

  const { data: existing, error: readError } = await supabase
    .from("competition_interests")
    .select("competition_id")
    .eq("profile_id", profileId)
    .eq("competition_id", competitionId)
    .maybeSingle();
  if (readError) return failFromDb(readError);

  let interested: boolean;
  if (existing) {
    const { error } = await supabase
      .from("competition_interests")
      .delete()
      .eq("profile_id", profileId)
      .eq("competition_id", competitionId);
    if (error) return failFromDb(error);
    interested = false;
  } else {
    const { error } = await supabase
      .from("competition_interests")
      .insert({ profile_id: profileId, competition_id: competitionId });
    // 23505: a double click already inserted it, which is the state the student wanted.
    if (error && error.code !== "23505") return failFromDb(error);
    interested = true;
  }

  const { count, error: countError } = await supabase
    .from("competition_interests")
    .select("profile_id", { count: "exact", head: true })
    .eq("competition_id", competitionId);
  if (countError) return failFromDb(countError);

  revalidatePath("/lomba", "layout");
  return ok({ interested, count: count ?? 0 });
}
