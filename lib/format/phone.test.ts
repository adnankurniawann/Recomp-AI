import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["08123456789", "+628123456789"],
    ["+62 812-3456-789", "+628123456789"],
    ["+62812 3456 789", "+628123456789"],
    ["628123456789", "+628123456789"],
    ["0812.3456.789", "+628123456789"],
    ["(0812) 3456 789", "+628123456789"],
    ["  08123456789  ", "+628123456789"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ["empty", ""],
    ["letters", "0812abc4567"],
    ["another country", "+6512345678"],
    ["no prefix", "8123456789"],
    ["too short", "0812345"],
    ["too long", "08123456789012345"],
    ["plus in the middle", "0812+3456789"],
  ])("rejects %s", (_label, input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});
