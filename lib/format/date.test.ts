import { describe, expect, it } from "vitest";
import { formatDate, todayIso } from "./date";

describe("date format", () => {
  it("formats ISO dates the Indonesian way", () => {
    expect(formatDate("2026-12-01")).toBe("1 Des 2026");
    expect(formatDate("2026-08-17", { year: false })).toBe("17 Agu");
  });

  it("reads today in Jakarta, not UTC", () => {
    // 20:00 UTC on the 19th is already the 20th in Jakarta (UTC+7).
    expect(todayIso(new Date("2026-11-19T20:00:00Z"))).toBe("2026-11-20");
  });
});
