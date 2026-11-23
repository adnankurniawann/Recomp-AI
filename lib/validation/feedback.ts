import { z } from "zod";
import { uuid } from "./common";

// "Cocok" / "Kurang cocok" on a ranked candidate (F-RNK-05, PRD §13.1 `submitFeedback`).
// The score and factors are the ones on screen, kept for the trial metrics (PRD §17).

const factor = z.number().min(0).max(1);

export const submitFeedbackSchema = z.object({
  teamRoleId: uuid,
  candidateId: uuid,
  feedback: z.enum(["fit", "not_fit"]),
  score: z.number().int().min(0).max(100),
  factors: z.object({
    coverage: factor,
    level: factor,
    availability: factor,
    experience: factor,
    fit: factor,
  }),
});
export type SubmitFeedbackInput = z.input<typeof submitFeedbackSchema>;
