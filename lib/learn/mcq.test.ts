import { describe, expect, it } from "vitest";
import { lessonPoints, optionState } from "./mcq";

describe("optionState", () => {
  it("marks only the picked option before answering", () => {
    const s = { picked: "B", answered: null, answerKey: null };
    expect(optionState("A", s)).toBe("idle");
    expect(optionState("B", s)).toBe("selected");
  });

  it("shows the right answer green and a wrong pick red after answering", () => {
    const s = { picked: "A", answered: "A", answerKey: "C" };
    expect(optionState("A", s)).toBe("wrong");
    expect(optionState("C", s)).toBe("correct");
    expect(optionState("B", s)).toBe("muted");
  });

  it("shows a right pick green only", () => {
    const s = { picked: "C", answered: "C", answerKey: "C" };
    expect(optionState("C", s)).toBe("correct");
    expect(optionState("A", s)).toBe("muted");
  });

  it("keeps the pick neutral if the key is somehow missing", () => {
    const s = { picked: "A", answered: "A", answerKey: null };
    expect(optionState("A", s)).toBe("selected");
    expect(optionState("B", s)).toBe("muted");
  });
});

describe("lessonPoints", () => {
  it("sums earned and possible points and counts answers", () => {
    expect(
      lessonPoints([
        { points: 5, attempt: { pointsAwarded: 5 } },
        { points: 5, attempt: { pointsAwarded: 0 } },
        { points: 10, attempt: null },
      ]),
    ).toEqual({ earned: 5, total: 20, answered: 2 });
    expect(lessonPoints([])).toEqual({ earned: 0, total: 0, answered: 0 });
  });
});
