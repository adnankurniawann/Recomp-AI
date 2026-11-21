import { describe, expect, it } from "vitest";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it.each([
    [0, "0 menit"],
    [8, "8 menit"],
    [59.6, "1 jam"],
    [60, "1 jam"],
    [80, "1 jam 20 menit"],
    [120, "2 jam"],
    [-5, "0 menit"],
  ])("%s minutes is %s", (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});
