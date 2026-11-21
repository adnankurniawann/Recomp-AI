import { COMPETITION_CATEGORY_LABELS, type CompCategory, type RoleSource } from "@/lib/constants";

/**
 * Where a suggested role came from, as the role card shows it (PRD F-TEM-02):
 * "Dari guidebook hal. 3", "Dari kriteria Desain antarmuka 20% (hal. 7)", "Template hackathon",
 * "Ditambah ketua".
 */
export function roleSourceLabel(
  role: { source: RoleSource; sourcePage: number | null; sourceCriterion: string | null },
  context: {
    category: CompCategory;
    /** Criteria from the same extraction, to show the weight of `sourceCriterion`. */
    criteria?: ReadonlyArray<{ name: string; weight_percent: number | null }>;
  },
): string {
  const page = role.sourcePage ? `hal. ${role.sourcePage}` : null;
  switch (role.source) {
    case "guidebook":
      return page ? `Dari guidebook ${page}` : "Dari guidebook";
    case "criteria": {
      if (!role.sourceCriterion) return page ? `Dari kriteria (${page})` : "Dari kriteria";
      const name = role.sourceCriterion.trim();
      const weight = context.criteria?.find(
        (c) => c.name.trim().toLowerCase() === name.toLowerCase(),
      )?.weight_percent;
      const what = weight != null ? `${name} ${weight}%` : name;
      return page ? `Dari kriteria ${what} (${page})` : `Dari kriteria ${what}`;
    }
    case "template":
      return `Template ${COMPETITION_CATEGORY_LABELS[context.category]}`;
    case "manual":
      return "Ditambah ketua";
  }
}
