import { z } from "zod";
import { uuid } from "./common";

// Invite inputs (PRD F-INV-01..03, F-INV-06, §13.1).

export const INVITE_MESSAGE_MAX = 500;

export const sendInviteSchema = z.object({
  teamRoleId: uuid,
  candidateId: uuid,
  message: z
    .string()
    .trim()
    .min(1, "Pesan undangan wajib diisi")
    .max(INVITE_MESSAGE_MAX, "Pesan maksimal 500 karakter"),
  aiDrafted: z.boolean().default(false),
  agentActionId: uuid.optional(),
});
export type SendInviteInput = z.input<typeof sendInviteSchema>;

export const respondInviteSchema = z.object({
  inviteId: uuid,
  action: z.enum(["accept", "decline"]),
});
export type RespondInviteInput = z.input<typeof respondInviteSchema>;

export const cancelInviteSchema = z.object({ inviteId: uuid });
export type CancelInviteInput = z.input<typeof cancelInviteSchema>;
