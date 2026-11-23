import { describe, expect, it } from "vitest";
import { filterMentors, parseMentorFilters, type MentorCardData } from "./list";

const mentor = (over: Partial<MentorCardData>): MentorCardData => ({
  id: over.name ?? "m",
  name: "Mentor",
  photoUrl: null,
  roles: ["backend"],
  headline: "",
  categories: ["hackathon"],
  minPrice: 75_000,
  verified: false,
  isSimulated: true,
  achievementCount: 1,
  ...over,
});

describe("parseMentorFilters", () => {
  it("keeps known values and defaults the sort", () => {
    expect(parseMentorFilters({ peran: "uiux", kategori: "data", harga: "100-200rb" })).toEqual({
      role: "uiux",
      category: "data",
      price: "100-200rb",
      sort: "rekomendasi",
    });
  });

  it("drops unknown values", () => {
    expect(parseMentorFilters({ peran: "other", urut: "acak", harga: "gratis" })).toEqual({
      role: undefined,
      category: undefined,
      price: undefined,
      sort: "rekomendasi",
    });
  });
});

describe("filterMentors", () => {
  const list = [
    mentor({ name: "Budi", roles: ["uiux"], minPrice: 150_000, achievementCount: 3 }),
    mentor({ name: "Ani", roles: ["backend"], categories: ["data"], minPrice: 75_000 }),
    mentor({ name: "Citra", roles: ["backend", "data"], verified: true, minPrice: null }),
  ];

  it("filters by role, category and price range", () => {
    const names = (f: Parameters<typeof filterMentors>[1]) =>
      filterMentors([...list], f).map((m) => m.name);
    expect(names({ role: "backend", sort: "rekomendasi" })).toEqual(["Citra", "Ani"]);
    expect(names({ category: "data", sort: "rekomendasi" })).toEqual(["Ani"]);
    expect(names({ price: "sampai-100rb", sort: "rekomendasi" })).toEqual(["Ani"]);
    expect(names({ price: "100-200rb", sort: "rekomendasi" })).toEqual(["Budi"]);
  });

  it("sorts by recommendation: verified, then achievements, then name", () => {
    expect(filterMentors([...list], { sort: "rekomendasi" }).map((m) => m.name)).toEqual([
      "Citra",
      "Budi",
      "Ani",
    ]);
  });

  it("sorts by lowest price, mentors without a service last", () => {
    expect(filterMentors([...list], { sort: "harga" }).map((m) => m.name)).toEqual([
      "Ani",
      "Budi",
      "Citra",
    ]);
  });
});
