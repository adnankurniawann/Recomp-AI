// Inputs and outputs of the ranking score (PRD §7.5). No banned attribute (gender, religion,
// ethnicity, campus, photo, age, entry year) may ever be added to CandidateInput (PRD §7.3).

export type Level = 1 | 2 | 3 | 4;

export type RoleKey = "backend" | "frontend" | "uiux" | "data" | "product" | "business" | "other";

export type Goal = "win" | "learn";

export type WorkTime = "morning" | "afternoon" | "night" | "flexible";

// Mirrors comp_category_t and comp_result_t in supabase/migrations (PRD §12.1).
export type CompetitionCategory =
  | "hackathon"
  | "it_competition"
  | "ui_ux"
  | "data"
  | "business_case"
  | "paper";

export type CompetitionResult =
  | "participant"
  | "finalist"
  | "winner_1"
  | "winner_2"
  | "winner_3"
  | "honorable";

export interface RoleRequirement {
  id: string;
  name: string;
  colorKey: RoleKey;
  requiredSkills: { skillId: number; minLevel: Level }[];
  optionalSkillIds: number[];
  hoursPerWeek: number;
}

export interface CandidateInput {
  profileId: string;
  preferredRoles: RoleKey[]; // 1 to 3
  skills: { skillId: number; level: Level; hasEvidence: boolean }[];
  hoursPerWeek: number;
  goal: Goal;
  workTime: WorkTime;
  history: { category: CompetitionCategory; result: CompetitionResult }[];
  updatedAt: string; // ISO timestamp, tie-break only
}

export interface TeamContext {
  competitionCategory: CompetitionCategory;
  goal: Goal;
  workTime: WorkTime;
}

export type FactorKey = "coverage" | "level" | "availability" | "experience" | "fit";

export interface MatchingConfig {
  weights: Record<FactorKey, number>;
  noEvidenceFactor: number; // 0.85
  optionalBonus: number; // 0.1
  experienceCap: number; // 3
  podiumBonus: number; // 0.2
}

export type ReasonIcon =
  | "check"
  | "check-partial"
  | "link"
  | "trophy"
  | "clock"
  | "clock-short"
  | "star"
  | "people";

export interface Reason {
  code: string;
  text: string;
  icon: ReasonIcon;
}

export interface ScoreResult {
  profileId: string;
  score: number; // 0..100
  factors: Record<FactorKey, number>; // 0..1
  matchedRequired: number[];
  missingRequired: number[];
  reasons: Reason[];
}

export type SkillNames = ReadonlyMap<number, string>;
