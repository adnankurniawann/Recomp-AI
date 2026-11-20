import { describe, expect, it } from "vitest";
import { publicStorageUrl } from "./storage";

const base = "https://abc.supabase.co";

describe("publicStorageUrl", () => {
  it("builds the public object URL", () => {
    expect(publicStorageUrl("portfolio", "p1/item-1.webp", base)).toBe(
      "https://abc.supabase.co/storage/v1/object/public/portfolio/p1/item-1.webp",
    );
  });

  it("encodes each path segment but keeps the slashes", () => {
    expect(publicStorageUrl("posters", "a b/c#d.png", `${base}/`)).toBe(
      "https://abc.supabase.co/storage/v1/object/public/posters/a%20b/c%23d.png",
    );
  });

  it("returns null without a path or a base URL", () => {
    expect(publicStorageUrl("portfolio", null, base)).toBeNull();
    expect(publicStorageUrl("portfolio", "", base)).toBeNull();
    expect(publicStorageUrl("portfolio", "p1/x.png", "")).toBeNull();
  });
});
