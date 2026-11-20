"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  cancelInviteSchema,
  respondInviteSchema,
  sendInviteSchema,
  type CancelInviteInput,
  type RespondInviteInput,
  type SendInviteInput,
} from "@/lib/validation/invite";

// Invite actions (PRD §13.1, F-INV-01..03, F-INV-06). The rules live in the SQL functions of
// migration 0004; these validate input, call them as the signed-in student and map the error.

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function logged<T>(error: { code?: string; message: string }): ActionResult<T> {
  if (error.code !== "P0001") console.error("[invite]", error.code, error.message);
  return failFromDb(error);
}

/** The leader invites a candidate to one role. AI drafts are sent only through this click (ADR 0004). */
export async function sendInvite(
  input: SendInviteInput,
): Promise<ActionResult<{ inviteId: string }>> {
  const parsed = sendInviteSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const d = parsed.data;
  const { data, error } = await supabase.rpc("send_invite", {
    p_team_role: d.teamRoleId,
    p_candidate: d.candidateId,
    p_message: d.message,
    p_ai_drafted: d.aiDrafted,
    ...(d.agentActionId && { p_agent_action: d.agentActionId }),
  });
  if (error) return logged(error);

  revalidatePath("/undangan");
  return ok({ inviteId: data });
}

/** The candidate accepts (atomic, `accept_invite`) or declines. */
export async function respondInvite(
  inviteId: RespondInviteInput["inviteId"],
  action: RespondInviteInput["action"],
): Promise<ActionResult<{ teamId: string }>> {
  const parsed = respondInviteSchema.safeParse({ inviteId, action });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const fn = parsed.data.action === "accept" ? "accept_invite" : "decline_invite";
  const { data, error } = await supabase.rpc(fn, { p_invite: parsed.data.inviteId });
  if (error) return logged(error);

  revalidatePath("/undangan");
  revalidatePath(`/tim/${data}`);
  return ok({ teamId: data });
}

/** The sender takes back an invite that is still pending. */
export async function cancelInvite(
  inviteId: CancelInviteInput["inviteId"],
): Promise<ActionResult<Record<string, never>>> {
  const parsed = cancelInviteSchema.safeParse({ inviteId });
  if (!parsed.success) return failValidation(parsed.error.issues);
  const supabase = await signedIn();
  if (!supabase) return fail("AUTH_REQUIRED");

  const { error } = await supabase.rpc("cancel_invite", { p_invite: parsed.data.inviteId });
  if (error) return logged(error);

  revalidatePath("/undangan");
  return ok({});
}
