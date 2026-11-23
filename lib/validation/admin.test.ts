import { describe, expect, it } from "vitest";
import { competitionSchema, reviewExtractionSchema } from "./admin";

const competition = {
  slug: "hackathon-uji-2026",
  name: "Hackathon Uji 2026",
  organizer: "Komunitas Uji",
  category: "hackathon",
  description: "",
  registrationDeadline: "2026-12-01",
  eventDate: "",
  teamMin: 2,
  teamMax: 4,
  officialUrl: "",
  isPublished: true,
  isFeatured: false,
  isSimulated: true,
} as const;

describe("competitionSchema", () => {
  it("turns empty optional fields into null", () => {
    const parsed = competitionSchema.parse(competition);
    expect(parsed).toMatchObject({ description: null, eventDate: null, officialUrl: null });
  });

  it("refuses a bad slug and a team minimum above the maximum", () => {
    const res = competitionSchema.safeParse({ ...competition, slug: "Hackathon Uji", teamMin: 5 });
    expect(res.success).toBe(false);
    const paths = res.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["slug", "teamMax"]));
  });
});

describe("reviewExtractionSchema", () => {
  const role = {
    name: "Backend Developer",
    colorKey: "backend",
    source: "guidebook",
    sourcePage: 3,
    sourceCriterion: null,
    edited: false,
    requiredSkills: [{ skillId: 1, minLevel: 2 }],
    optionalSkillIds: [],
    hoursPerWeek: 8,
    slots: 2,
    reason: "Juri menilai backend",
  } as const;
  const review = {
    extractionId: "00000000-0000-4000-8000-000000000001",
    summary: "Ringkasan",
    teamSize: { min: 2, max: 3 },
    deadlines: [{ name: "Pendaftaran", date: "2026-12-01", page: 2 }],
    criteria: [{ name: "Desain", weightPercent: 20, page: 7 }],
    roles: [role],
  };

  it("accepts an edited review", () => {
    expect(reviewExtractionSchema.safeParse(review).success).toBe(true);
  });

  it("refuses more role slots than the team maximum", () => {
    const res = reviewExtractionSchema.safeParse({ ...review, roles: [role, role] });
    expect(res.success).toBe(false);
    expect(res.error!.issues[0]!.path).toEqual(["roles"]);
  });
});
