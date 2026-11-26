import { describe, expect, it } from "vitest";
import {
  deadlineStatus,
  filterCompetitions,
  parseFilters,
  type CompetitionSummary,
} from "./filter";

const today = "2026-11-19";
const base: CompetitionSummary = {
  id: "x",
  slug: "x",
  name: "X",
  organizer: "Org",
  category: "hackathon",
  registrationDeadline: null,
  teamMin: 2,
  teamMax: 4,
  posterUrl: null,
  hasGuidebook: false,
  interestCount: 0,
  isSimulated: false,
  isFeatured: false,
};
const comp = (over: Partial<CompetitionSummary>) => ({ ...base, ...over });

describe("deadlineStatus", () => {
  it("treats 7 days or less as closing, past as closed, none as open", () => {
    expect(deadlineStatus("2026-11-26", today)).toBe("closing");
    expect(deadlineStatus("2026-11-27", today)).toBe("open");
    expect(deadlineStatus("2026-11-19", today)).toBe("closing");
    expect(deadlineStatus("2026-11-18", today)).toBe("closed");
    expect(deadlineStatus(null, today)).toBe("open");
  });
});

describe("filterCompetitions", () => {
  const list = [
    comp({ id: "closed", registrationDeadline: "2026-11-01" }),
    comp({ id: "far", registrationDeadline: "2026-12-30", category: "ui_ux", teamMin: 1 }),
    comp({ id: "none" }),
    comp({ id: "soon", registrationDeadline: "2026-11-22", name: "Hack Jakarta" }),
  ];
  const ids = (f: Parameters<typeof filterCompetitions>[1]) =>
    filterCompetitions(list, f, today).map((c) => c.id);

  it("sorts nearest open deadline first, then no deadline, then closed", () => {
    expect(ids({})).toEqual(["soon", "far", "none", "closed"]);
  });

  it("puts featured competitions first, even when closed", () => {
    const withFeatured = [
      ...list,
      comp({ id: "stack", registrationDeadline: "2026-11-07", isFeatured: true }),
    ];
    expect(filterCompetitions(withFeatured, {}, today).map((c) => c.id)).toEqual([
      "stack",
      "soon",
      "far",
      "none",
      "closed",
    ]);
  });

  it("filters by category, deadline, team size and keyword", () => {
    expect(ids({ category: "ui_ux" })).toEqual(["far"]);
    expect(ids({ deadline: "open" })).toEqual(["soon", "far", "none"]);
    expect(ids({ deadline: "closing" })).toEqual(["soon"]);
    expect(ids({ deadline: "closed" })).toEqual(["closed"]);
    expect(ids({ teamSize: 1 })).toEqual(["far"]);
    expect(ids({ q: "jakarta" })).toEqual(["soon"]);
  });
});

describe("parseFilters", () => {
  it("keeps known values and drops the rest", () => {
    expect(parseFilters({ kategori: "data", deadline: "closing", tim: "3", q: " ai " })).toEqual({
      category: "data",
      deadline: "closing",
      teamSize: 3,
      q: "ai",
    });
    expect(parseFilters({ kategori: "nope", deadline: ["open"], tim: "9", q: " " })).toEqual({
      category: undefined,
      deadline: undefined,
      teamSize: undefined,
      q: undefined,
    });
  });
});
