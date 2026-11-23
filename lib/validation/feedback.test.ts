import { describe, expect, it } from "vitest";
import { submitFeedbackSchema } from "./feedback";

const valid = {
  teamRoleId: "3f1c7a52-6a8e-4c43-9a57-0d0f3cbbd0a1",
  candidateId: "9b2e4d10-1c5f-4f7e-8a3b-2d6c1e0f9a87",
  feedback: "fit",
  score: 92,
  factors: { coverage: 1, level: 0.925, availability: 0.75, experience: 0.867, fit: 1 },
};

describe("submitFeedbackSchema", () => {
  it("accepts fit and not_fit with the shown score and factors", () => {
    expect(submitFeedbackSchema.safeParse(valid).success).toBe(true);
    expect(submitFeedbackSchema.safeParse({ ...valid, feedback: "not_fit" }).success).toBe(true);
  });

  it("rejects other feedback values, scores outside 0–100 and factors above 1", () => {
    expect(submitFeedbackSchema.safeParse({ ...valid, feedback: "maybe" }).success).toBe(false);
    expect(submitFeedbackSchema.safeParse({ ...valid, score: 101 }).success).toBe(false);
    expect(submitFeedbackSchema.safeParse({ ...valid, score: 9.5 }).success).toBe(false);
    expect(
      submitFeedbackSchema.safeParse({ ...valid, factors: { ...valid.factors, fit: 1.2 } }).success,
    ).toBe(false);
  });

  it("rejects ids that aren't uuids", () => {
    expect(submitFeedbackSchema.safeParse({ ...valid, teamRoleId: "role-1" }).success).toBe(false);
  });
});
