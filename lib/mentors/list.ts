import {
  COMP_CATEGORIES,
  PREFERRED_ROLE_KEYS,
  type CompCategory,
  type PreferredRoleKey,
  type RoleKey,
} from "@/lib/constants";

// The mentor grid /mentor (PRD F-MNT-01, §10.8): filters from the URL, then filter and sort.

export interface MentorCardData {
  id: string;
  name: string;
  photoUrl: string | null;
  roles: RoleKey[];
  headline: string;
  categories: CompCategory[];
  /** Cheapest service, for "Mulai dari"; null when the mentor has no service yet. */
  minPrice: number | null;
  verified: boolean;
  isSimulated: boolean;
  achievementCount: number;
}

export const PRICE_FILTERS = ["sampai-100rb", "100-200rb", "di-atas-200rb"] as const;
export type PriceFilter = (typeof PRICE_FILTERS)[number];
export const PRICE_LABELS: Record<PriceFilter, string> = {
  "sampai-100rb": "Sampai Rp100.000",
  "100-200rb": "Rp100.000 sampai Rp200.000",
  "di-atas-200rb": "Di atas Rp200.000",
};

export const MENTOR_SORTS = ["rekomendasi", "harga"] as const;
export type MentorSort = (typeof MENTOR_SORTS)[number];
export const MENTOR_SORT_LABELS: Record<MentorSort, string> = {
  rekomendasi: "Rekomendasi",
  harga: "Harga terendah",
};

export interface MentorFilters {
  role?: PreferredRoleKey;
  category?: CompCategory;
  price?: PriceFilter;
  sort: MentorSort;
}

/** Reads `?peran`, `?kategori`, `?harga` and `?urut`; unknown values are dropped. */
export function parseMentorFilters(
  params: Record<string, string | string[] | undefined>,
): MentorFilters {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  return {
    role: PREFERRED_ROLE_KEYS.find((r) => r === one("peran")),
    category: COMP_CATEGORIES.find((c) => c === one("kategori")),
    price: PRICE_FILTERS.find((p) => p === one("harga")),
    sort: MENTOR_SORTS.find((s) => s === one("urut")) ?? "rekomendasi",
  };
}

function inPriceRange(price: number | null, range: PriceFilter): boolean {
  if (price === null) return false;
  if (range === "sampai-100rb") return price <= 100_000;
  if (range === "100-200rb") return price >= 100_000 && price <= 200_000;
  return price > 200_000;
}

/**
 * Filters, then sorts. "Rekomendasi": verified first, then more achievements, then name.
 * "Harga terendah": cheapest starting price first, mentors without a service last.
 */
export function filterMentors(list: MentorCardData[], f: MentorFilters): MentorCardData[] {
  const result = list.filter(
    (m) =>
      (!f.role || m.roles.includes(f.role)) &&
      (!f.category || m.categories.includes(f.category)) &&
      (!f.price || inPriceRange(m.minPrice, f.price)),
  );
  const byName = (a: MentorCardData, b: MentorCardData) => a.name.localeCompare(b.name, "id");
  if (f.sort === "harga") {
    const price = (m: MentorCardData) => m.minPrice ?? Number.POSITIVE_INFINITY;
    return result.sort((a, b) => price(a) - price(b) || byName(a, b));
  }
  return result.sort(
    (a, b) =>
      Number(b.verified) - Number(a.verified) ||
      b.achievementCount - a.achievementCount ||
      byName(a, b),
  );
}
