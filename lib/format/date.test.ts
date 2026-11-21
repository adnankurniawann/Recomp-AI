import { describe, expect, it } from "vitest";
import { formatDate, formatRelativeTime, formatSlot, todayIso } from "./date";

describe("formatSlot", () => {
  it("shows the day, date and Jakarta time", () => {
    expect(formatSlot("2026-11-28T12:00:00Z")).toBe("Sab 28 Nov 19.00");
    // 18:30 UTC on Friday is already Saturday 01.30 in Jakarta.
    expect(formatSlot("2026-11-27T18:30:00Z")).toBe("Sab 28 Nov 01.30");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-20T10:00:00Z");
  it.each([
    ["2026-11-20T09:59:30Z", "baru saja"],
    ["2026-11-20T10:00:05Z", "baru saja"],
    ["2026-11-20T09:55:00Z", "5 menit lalu"],
    ["2026-11-20T07:00:00Z", "3 jam lalu"],
    ["2026-11-18T09:00:00Z", "2 hari lalu"],
    ["2026-11-12T20:00:00Z", "13 Nov 2026"],
  ])("%s → %s", (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

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
