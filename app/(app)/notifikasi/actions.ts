"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { markNotificationsReadSchema } from "@/lib/validation/notification";

/**
 * Mark the caller's notifications read (PRD §13.1, F-NTF-01); without ids, all of them. Ids that
 * aren't theirs are ignored.
 */
export async function markNotificationsRead(
  ids?: string[],
): Promise<ActionResult<Record<string, never>>> {
  const parsed = markNotificationsReadSchema.safeParse({ ids });
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  // The generated Args type has no null; the SQL function reads null as "all".
  const { error } = await supabase.rpc("mark_notifications_read", {
    p_ids: (parsed.data.ids ?? null) as string[],
  });
  if (error) {
    if (error.code !== "P0001") console.error("[notifications]", error.code, error.message);
    return failFromDb(error);
  }
  // The bell lives in both layouts; its count comes from the server.
  revalidatePath("/", "layout");
  return ok({});
}
