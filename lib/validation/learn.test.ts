import { describe, expect, it } from "vitest";
import { caseFeedbackSchema, redeemPromoSchema, submitMcqSchema } from "./learn";

const id = "3f0b6a52-4c1e-4d7a-9b8e-2a1c5d6e7f80";

describe("submitMcqSchema", () => {
  it("accepts A to E and uppercases the choice", () => {
    expect(submitMcqSchema.parse({ questionId: id, choice: " b " }).choice).toBe("B");
    expect(submitMcqSchema.safeParse({ questionId: id, choice: "E" }).success).toBe(true);
  });

  it.each(["F", "", "AB", "1"])("rejects the choice %s", (choice) => {
    expect(submitMcqSchema.safeParse({ questionId: id, choice }).success).toBe(false);
  });

  it("requires a question uuid", () => {
    expect(submitMcqSchema.safeParse({ questionId: "q1", choice: "A" }).success).toBe(false);
  });
});

describe("redeemPromoSchema", () => {
  it("trims and uppercases the code", () => {
    expect(redeemPromoSchema.parse({ courseId: id, code: "  penggunaawal " }).code).toBe(
      "PENGGUNAAWAL",
    );
  });

  it("rejects an empty or very long code", () => {
    expect(redeemPromoSchema.safeParse({ courseId: id, code: "  " }).success).toBe(false);
    expect(redeemPromoSchema.safeParse({ courseId: id, code: "X".repeat(41) }).success).toBe(false);
  });
});

describe("caseFeedbackSchema", () => {
  const questionId = "3f1c7a52-6a8e-4c43-9a57-0d0f3cbbd0a1";

  it("trims the answer and accepts 20 to 2,000 characters", () => {
    const r = caseFeedbackSchema.safeParse({ questionId, answer: `  ${"a".repeat(20)}  ` });
    expect(r.success && r.data.answer).toBe("a".repeat(20));
    expect(caseFeedbackSchema.safeParse({ questionId, answer: "a".repeat(2000) }).success).toBe(
      true,
    );
  });

  it("rejects short and long answers with an Indonesian message", () => {
    const short = caseFeedbackSchema.safeParse({ questionId, answer: "terlalu pendek" });
    expect(short.success).toBe(false);
    expect(short.error?.issues[0]?.message).toBe("Jawaban minimal 20 karakter");
    expect(caseFeedbackSchema.safeParse({ questionId, answer: "a".repeat(2001) }).success).toBe(
      false,
    );
  });
});
