import { describe, expect, it } from "vitest";
import { formatScore } from "./case";

describe("formatScore", () => {
  it("shows whole numbers plain and one decimal with a comma", () => {
    expect(formatScore(3)).toBe("3");
    expect(formatScore(2.5)).toBe("2,5");
    expect(formatScore(2.46)).toBe("2,5");
    expect(formatScore(0)).toBe("0");
  });
});
