import { z } from "zod";
import { uuid } from "./common";

// The leader's answer to one recruiter draft (F-RCR-01, F-RCR-03).
export const recruitDecisionSchema = z.object({
  agentActionId: uuid,
  candidateId: uuid,
  decision: z.enum(["sent", "skipped"]),
});
export type RecruitDecisionInput = z.input<typeof recruitDecisionSchema>;

export const teamRoleIdSchema = z.object({ teamRoleId: uuid });
