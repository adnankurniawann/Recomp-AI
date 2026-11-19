import { describe, expect, it } from "vitest";
import { httpsUrl, isHttpsUrl, optionalHttpsUrl } from "./common";

describe("isHttpsUrl", () => {
  it.each(["https://github.com/dinda", "https://www.behance.net/x?y=1", "https://a.id"])(
    "accepts %s",
    (url) => expect(isHttpsUrl(url)).toBe(true),
  );

  it.each([
    "http://github.com/dinda",
    "javascript:alert(1)",
    "ftp://files.example.com",
    "github.com/dinda",
    "https://localhost",
    "",
  ])("rejects %s", (url) => expect(isHttpsUrl(url)).toBe(false));
});

describe("httpsUrl", () => {
  it("trims and accepts an https link", () => {
    expect(httpsUrl.parse("  https://figma.com/file/1  ")).toBe("https://figma.com/file/1");
  });

  it("rejects links over 500 characters", () => {
    expect(httpsUrl.safeParse(`https://a.id/${"x".repeat(500)}`).success).toBe(false);
  });
});

describe("optionalHttpsUrl", () => {
  it.each([[""], [null], [undefined]])("turns %s into null", (value) => {
    expect(optionalHttpsUrl.parse(value)).toBeNull();
  });

  it("still rejects http", () => {
    expect(optionalHttpsUrl.safeParse("http://a.id").success).toBe(false);
  });
});
