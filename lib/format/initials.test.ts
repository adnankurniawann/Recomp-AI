import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it.each([
    ["Dinda Putri", "DP"],
    ["rani", "R"],
    ["Muhammad Adnan Kurniawan", "MK"],
    ["  arif   fadhil  ", "AF"],
    ["", "?"],
    ["   ", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
