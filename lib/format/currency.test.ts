import { describe, expect, it } from "vitest";
import { formatRupiah } from "./currency";

describe("formatRupiah", () => {
  it.each([
    [0, "Rp0"],
    [500, "Rp500"],
    [75000, "Rp75.000"],
    [1250000, "Rp1.250.000"],
    [49999.6, "Rp50.000"],
    [-15000, "-Rp15.000"],
  ])("%d → %s", (amount, expected) => {
    expect(formatRupiah(amount)).toBe(expected);
  });
});
