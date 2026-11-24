import { describe, expect, it } from "vitest";
import { approvalFor } from "./recruit-decisions";

describe("approvalFor", () => {
  const ids = ["a", "b", "c"];

  it("stays pending until the leader answers", () => {
    expect(approvalFor(ids, {})).toBe("pending");
    expect(approvalFor(ids, { a: "skipped" })).toBe("pending");
  });

  it("is approved as soon as one draft is sent", () => {
    expect(approvalFor(ids, { b: "sent" })).toBe("approved");
    expect(approvalFor(ids, { a: "skipped", b: "skipped", c: "sent" })).toBe("approved");
  });

  it("is rejected when every draft was skipped", () => {
    expect(approvalFor(ids, { a: "skipped", b: "skipped", c: "skipped" })).toBe("rejected");
  });

  it("ignores answers for candidates that weren't drafted", () => {
    expect(approvalFor(ids, { z: "sent" })).toBe("pending");
  });
});
