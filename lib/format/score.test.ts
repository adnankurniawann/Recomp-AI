import { describe, expect, it } from "vitest";
import { FACTOR_KEYS, factorPoints, scoreTone } from "./score";

describe("factorPoints", () => {
  it("shows a full factor as its whole weight", () => {
    expect(factorPoints(1, 0.4).text).toBe("40/40");
  });

  it("keeps one decimal with an Indonesian comma", () => {
    expect(factorPoints(0.925, 0.2)).toEqual({ value: 18.5, max: 20, text: "18,5/20" });
    expect(factorPoints(0.867, 0.1).text).toBe("8,7/10");
  });

  it("clamps factors outside 0..1", () => {
    expect(factorPoints(1.2, 0.2).text).toBe("20/20");
    expect(factorPoints(-0.1, 0.2).text).toBe("0/20");
  });
});

describe("scoreTone", () => {
  it.each([
    [100, "success"],
    [80, "success"],
    [79, "primary"],
    [60, "primary"],
    [59, "warning"],
    [0, "warning"],
  ] as const)("%i is %s", (score, tone) => expect(scoreTone(score)).toBe(tone));
});

it("lists the five factors in PRD order", () => {
  expect(FACTOR_KEYS).toEqual(["coverage", "level", "availability", "experience", "fit"]);
});
