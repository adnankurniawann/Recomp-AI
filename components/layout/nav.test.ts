import { describe, expect, it } from "vitest";
import { isActive } from "./nav";

describe("isActive", () => {
  it("matches the page itself and pages under it", () => {
    expect(isActive("/tim", "/tim")).toBe(true);
    expect(isActive("/tim/baru", "/tim")).toBe(true);
    expect(isActive("/tim/123/peran", "/tim")).toBe(true);
  });

  it("doesn't match a sibling that only shares a prefix", () => {
    expect(isActive("/timnas", "/tim")).toBe(false);
    expect(isActive("/lomba", "/tim")).toBe(false);
  });
});
