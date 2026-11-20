import { describe, expect, it } from "vitest";
import {
  afterSignInPath,
  isPublicPath,
  needsOnboardingFlag,
  routeRedirect,
  safeNext,
  signInUrl,
} from "./redirects";

const route = (pathname: string, signedIn: boolean, onboardingDone = false, search = "") =>
  routeRedirect({ pathname, search, signedIn, onboardingDone });

describe("isPublicPath", () => {
  it.each(["/", "/masuk", "/lomba", "/lomba/hackathon-x", "/u/dinda", "/belajar", "/mentor/abc"])(
    "%s is public",
    (p) => expect(isPublicPath(p)).toBe(true),
  );

  it.each([
    "/onboarding",
    "/profil",
    "/tim/baru",
    "/tim/123",
    "/undangan",
    "/belajar/kursus/materi",
    "/mentor/abc/checkout",
    "/admin",
  ])("%s needs a session", (p) => expect(isPublicPath(p)).toBe(false));
});

describe("safeNext", () => {
  it("keeps a path on this site, with its query", () => {
    expect(safeNext("/tim/baru?lomba=x")).toBe("/tim/baru?lomba=x");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "lomba"])(
    "falls back for %s",
    (next) => expect(safeNext(next)).toBe("/lomba"),
  );

  it("never sends back to the sign-in page", () => {
    expect(safeNext("/masuk?next=/profil")).toBe("/lomba");
  });
});

describe("afterSignInPath", () => {
  it("sends a new student to onboarding, whatever next says", () => {
    expect(afterSignInPath(false, "/tim/baru")).toBe("/onboarding");
  });

  it("sends a student with a finished profile to next, or /lomba", () => {
    expect(afterSignInPath(true, "/undangan")).toBe("/undangan");
    expect(afterSignInPath(true, null)).toBe("/lomba");
  });
});

describe("routeRedirect", () => {
  it("lets anyone open public pages", () => {
    expect(route("/lomba", false)).toBeNull();
    expect(route("/u/dinda", false)).toBeNull();
  });

  it("sends a visitor without a session to /masuk with next", () => {
    expect(route("/tim/baru", false, false, "?lomba=x")).toBe(signInUrl("/tim/baru", "?lomba=x"));
    expect(signInUrl("/tim/baru", "?lomba=x")).toBe("/masuk?next=%2Ftim%2Fbaru%3Flomba%3Dx");
  });

  it("sends a signed-in student without a finished profile to /onboarding", () => {
    expect(route("/profil", true, false)).toBe("/onboarding");
    expect(route("/onboarding", true, false)).toBeNull();
  });

  it("still lets that student browse public pages", () => {
    expect(route("/lomba", true, false)).toBeNull();
  });

  it("lets a student with a finished profile through, but not back into onboarding", () => {
    expect(route("/tim/baru", true, true)).toBeNull();
    expect(route("/onboarding", true, true)).toBe("/lomba");
  });

  it("moves a signed-in student off /masuk", () => {
    expect(route("/masuk", true, true, "?next=%2Fundangan")).toBe("/undangan");
    expect(route("/masuk", true, false, "?next=%2Fundangan")).toBe("/onboarding");
  });

  it("never redirects route handlers or the OAuth callback", () => {
    expect(route("/api/ranking/1", false)).toBeNull();
    expect(route("/auth/callback", false)).toBeNull();
  });
});

describe("needsOnboardingFlag", () => {
  it("reads the profile only for signed-in requests to app pages or /masuk", () => {
    expect(needsOnboardingFlag("/profil", true)).toBe(true);
    expect(needsOnboardingFlag("/masuk", true)).toBe(true);
    expect(needsOnboardingFlag("/lomba", true)).toBe(false);
    expect(needsOnboardingFlag("/profil", false)).toBe(false);
    expect(needsOnboardingFlag("/api/ai/guidebook", true)).toBe(false);
  });
});
