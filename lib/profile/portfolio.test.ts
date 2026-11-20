import { describe, expect, it } from "vitest";
import { portfolioLinkKind } from "./portfolio";

describe("portfolioLinkKind", () => {
  it.each([
    ["https://github.com/dinda/app", "github"],
    ["https://dinda.github.io/portfolio", "github"],
    ["https://www.figma.com/file/abc", "figma"],
    ["https://figma.com/proto/abc", "figma"],
    ["https://www.behance.net/dinda", "behance"],
    ["https://dribbble.com/dinda", "other"],
    ["https://notgithub.com/x", "other"],
    ["https://github.com.evil.id/x", "other"],
    ["not a url", "other"],
  ])("%s → %s", (url, kind) => {
    expect(portfolioLinkKind(url)).toBe(kind);
  });
});
