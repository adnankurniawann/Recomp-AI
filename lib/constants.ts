import type { CompetitionCategory, Level } from "./matching/types";

export const LEVEL_LABELS: Record<Level, string> = {
  1: "Dasar",
  2: "Menengah",
  3: "Mahir",
  4: "Ahli",
};

// Lowercase, as it reads mid-sentence: "Pernah ikut 2 hackathon".
export const COMPETITION_CATEGORY_LABELS: Record<CompetitionCategory, string> = {
  hackathon: "hackathon",
  it_competition: "lomba IT",
  ui_ux: "lomba UI/UX",
  data: "lomba data",
  business_case: "business case",
  paper: "lomba paper",
};
