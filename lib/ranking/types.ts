import type { RoleKey } from "@/lib/constants";
import type { FactorKey, Level, Reason } from "@/lib/matching/types";

// The response of GET /api/ranking/[teamRoleId]?limit=20&offset=0 (PRD §13.2). The fixture in
// lib/fixtures (`fixtureRanking`) returns the same shape, so screens work before the API exists.

export interface RankingRole {
  id: string;
  name: string;
  colorKey: RoleKey;
  requiredSkills: { skillId: number; name: string; minLevel: Level }[];
  hoursPerWeek: number;
}

export interface RankingCandidate {
  profile: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    campus: string | null;
    major: string | null;
    entryYear: number | null;
    preferredRoles: RoleKey[];
    isSimulated: boolean;
  };
  score: number;
  factors: Record<FactorKey, number>;
  weights: Record<FactorKey, number>;
  matchedRequired: { skillId: number; name: string; level: Level; hasEvidence: boolean }[];
  missingRequired: { skillId: number; name: string; minLevel: Level }[];
  reasons: Reason[];
  inviteStatus: "pending" | "accepted" | "declined" | null;
  /** "Cocok" or "Kurang cocok" from this team (F-RNK-05), null when nobody rated yet. */
  feedback: RecommendationFeedback | null;
}

export type RecommendationFeedback = "fit" | "not_fit";

export interface RankingPage {
  role: RankingRole;
  total: number;
  candidates: RankingCandidate[];
}

export const RANKING_PAGE_SIZE = 20;
