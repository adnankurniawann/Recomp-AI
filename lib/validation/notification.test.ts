import { describe, expect, it } from "vitest";
import { markNotificationsReadSchema } from "./notification";

const id = "3f0b6a52-4c1e-4d7a-9b8e-2a1c5d6e7f80";

describe("markNotificationsReadSchema", () => {
  it("accepts a list of uuids, or nothing for all", () => {
    expect(markNotificationsReadSchema.safeParse({ ids: [id] }).success).toBe(true);
    expect(markNotificationsReadSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an empty list, a bad id or too many ids", () => {
    expect(markNotificationsReadSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(markNotificationsReadSchema.safeParse({ ids: ["n1"] }).success).toBe(false);
    expect(markNotificationsReadSchema.safeParse({ ids: Array(51).fill(id) }).success).toBe(false);
  });
});
