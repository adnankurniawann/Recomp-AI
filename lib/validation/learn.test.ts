import { describe, expect, it } from "vitest";
import { redeemPromoSchema, submitMcqSchema } from "./learn";

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
