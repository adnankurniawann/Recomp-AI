import { describe, expect, it } from "vitest";
import { generateProfiles, type SeedSkill } from "./profiles";

// Same ids and slugs as supabase/seed.sql.
const skills: SeedSkill[] = [
  "backend-development",
  "frontend-development",
  "react",
  "nextjs",
  "nodejs",
  "database",
  "api-design",
  "cloud-deployment",
  "mobile-development",
  "flutter",
  "git",
  "tailwind-css",
  "typescript",
  "algorithms",
  "cybersecurity",
  "figma",
  "user-research",
  "prototyping",
  "design-system",
  "illustration",
  "ui-design",
  "python",
  "machine-learning",
  "data-analysis",
  "llm-integration",
  "computer-vision",
  "sql",
  "data-visualization",
  "statistics",
  "product-management",
  "business-model",
  "market-research",
  "financial-modeling",
  "pitch-deck",
  "business-strategy",
  "public-speaking",
  "copywriting",
  "video-editing",
  "academic-writing",
  "literature-review",
].map((slug, i) => ({ id: i + 1, slug }));
const competitionIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

describe("generateProfiles", () => {
  const rows = generateProfiles({ count: 500, skills, competitionIds });

  it("gives the same rows for the same seed", () => {
    expect(generateProfiles({ count: 50, skills, competitionIds })).toEqual(
      generateProfiles({ count: 50, skills, competitionIds }),
    );
  });

  it("makes valid, unique, simulated profiles", () => {
    expect(rows.profiles).toHaveLength(500);
    expect(new Set(rows.profiles.map((p) => p.username)).size).toBe(500);
    for (const p of rows.profiles) {
      expect(p.username).toMatch(/^[a-z0-9_]{3,20}$/);
      expect(p.is_simulated).toBe(true);
      expect(p.preferred_roles!.length).toBeGreaterThanOrEqual(1);
      expect(p.preferred_roles!.length).toBeLessThanOrEqual(3);
      expect((p.bio ?? "").length).toBeLessThanOrEqual(280);
    }
  });

  it("follows the role mix of PRD §15 within a few points", () => {
    const share = (roles: string[]) =>
      rows.profiles.filter((p) => roles.includes(p.preferred_roles![0]!)).length / 500;
    expect(share(["backend", "frontend"])).toBeCloseTo(0.3, 1);
    expect(share(["uiux"])).toBeCloseTo(0.25, 1);
    expect(share(["data"])).toBeCloseTo(0.2, 1);
    expect(share(["product", "business"])).toBeCloseTo(0.25, 1);
  });

  it("keeps skills, history, portfolio and interests within the PRD ranges", () => {
    const per = <T extends { profile_id: string }>(list: T[]) =>
      rows.profiles.map((p) => list.filter((r) => r.profile_id === p.id).length);
    expect(Math.min(...per(rows.skills))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...per(rows.history))).toBeLessThanOrEqual(4);
    expect(Math.max(...per(rows.portfolio))).toBeLessThanOrEqual(3);
    expect(Math.min(...per(rows.interests))).toBeGreaterThanOrEqual(1);
    expect(Math.max(...per(rows.interests))).toBeLessThanOrEqual(3);

    const levels = rows.skills.map((s) => s.level);
    expect(levels.every((l) => l >= 1 && l <= 4)).toBe(true);
    const withEvidence = rows.skills.filter((s) => s.evidence_url).length / rows.skills.length;
    expect(withEvidence).toBeCloseTo(0.4, 1);
    expect(rows.contacts.every((c) => /^\+62[0-9]{8,13}$/.test(c.whatsapp ?? ""))).toBe(true);
  });

  it("skips interests when there are no competitions yet", () => {
    expect(generateProfiles({ count: 5, skills, competitionIds: [] }).interests).toEqual([]);
  });
});
