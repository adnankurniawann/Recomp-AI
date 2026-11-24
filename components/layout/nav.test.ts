import { describe, expect, it } from "vitest";
import { activeHref, isActive } from "./nav";

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

describe("activeHref", () => {
  const hrefs = ["/lomba", "/admin", "/admin/metrik"];

  it("picks the most specific link", () => {
    expect(activeHref("/admin/metrik", hrefs)).toBe("/admin/metrik");
    expect(activeHref("/admin", hrefs)).toBe("/admin");
    expect(activeHref("/lomba/stack-2026", hrefs)).toBe("/lomba");
  });

  it("returns null off the nav", () => {
    expect(activeHref("/profil", hrefs)).toBeNull();
  });
});
