import { z } from "zod";

// Output contract of the guidebook agent (PRD §8.1). Sent to Gemini as a JSON schema and checked
// again here, because the model can still return something else.

const page = z.number().int().positive().nullable();

export const GuidebookExtraction = z
  .object({
    summary: z.string().max(600),
    team_size: z.object({ min: z.number().int().min(1), max: z.number().int().max(10), page }),
    deadlines: z
      .array(
        z.object({
          name: z.string(),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable(),
          page,
        }),
      )
      .max(15),
    judging_criteria: z
      .array(
        z.object({
          name: z.string(),
          weight_percent: z.number().min(0).max(100).nullable(),
          description: z.string().max(300).optional(),
          page,
        }),
      )
      .max(20),
    suggested_roles: z
      .array(
        z.object({
          name: z.string().min(2).max(40),
          reason: z.string().max(300),
          source: z.enum(["guidebook", "criteria", "template"]),
          source_criterion: z.string().nullable(),
          page,
          required_skills: z
            .array(z.object({ skill: z.string(), min_level: z.number().int().min(1).max(4) }))
            .min(1)
            .max(6),
          optional_skills: z.array(z.string()).max(6),
          hours_per_week: z.number().int().min(1).max(40),
          slots: z.number().int().min(1).max(3),
        }),
      )
      .min(1)
      .max(6),
    warnings: z.array(z.string()).max(10),
  })
  // Prompt rule 5. Checked here so a wrong answer gets the one retry with this message.
  .superRefine((v, ctx) => {
    if (v.team_size.min > v.team_size.max) {
      ctx.addIssue({ code: "custom", path: ["team_size"], message: "min must not exceed max" });
    }
    const slots = v.suggested_roles.reduce((sum, r) => sum + r.slots, 0);
    if (slots > v.team_size.max) {
      ctx.addIssue({
        code: "custom",
        path: ["suggested_roles"],
        message: `total slots (${slots}) exceed the maximum team size (${v.team_size.max})`,
      });
    }
  });

export type GuidebookExtraction = z.infer<typeof GuidebookExtraction>;

/** JSON schema for Gemini's `responseJsonSchema`. Refinements are not included; Zod checks them. */
export const GUIDEBOOK_JSON_SCHEMA = z.toJSONSchema(GuidebookExtraction, { io: "input" });

/** Short, one-line-per-issue description of what failed, for the repair prompt. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 10)
    .map((i) => `- ${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`)
    .join("\n");
}
