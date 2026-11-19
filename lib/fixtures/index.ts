// Simulated data for building screens before the database is wired (TODO H0). Every profile is
// fictional and `isSimulated`. Skill ids match supabase/seed.sql. The ranking is computed by
// lib/matching, never typed by hand, so it always agrees with the score function.
// shortcut: view shapes are written here until lib/supabase/types.ts exists; then derive them from it.
import { DEFAULT_MATCHING_CONFIG, rankCandidates } from "../matching/score";
import type {
  CandidateInput,
  CompetitionCategory,
  CompetitionResult,
  Goal,
  Level,
  RoleKey,
  RoleRequirement,
  TeamContext,
  WorkTime,
} from "../matching/types";

export const fixtureSkillNames = new Map<number, string>([
  [1, "Backend Development"],
  [2, "Frontend Development"],
  [3, "React"],
  [6, "Database"],
  [7, "API Design"],
  [16, "Figma"],
  [17, "User Research"],
  [18, "Prototyping"],
  [19, "Design System"],
  [30, "Product Management"],
  [31, "Business Model"],
  [34, "Pitch Deck"],
  [36, "Public Speaking"],
]);

export interface FixtureProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  campus: string;
  major: string;
  entryYear: number;
  bio: string;
  preferredRoles: RoleKey[];
  hoursPerWeek: number;
  goal: Goal;
  workTime: WorkTime;
  openToInvite: boolean;
  isSimulated: boolean;
  updatedAt: string;
  skills: { skillId: number; name: string; level: Level; evidenceUrl: string | null }[];
  history: {
    competitionName: string;
    year: number;
    category: CompetitionCategory;
    role: string;
    result: CompetitionResult;
    evidenceUrl: string | null;
  }[];
  portfolio: { title: string; description: string; url: string; skillIds: number[] }[];
}

const skill = (skillId: number, level: Level, evidenceUrl: string | null = null) => ({
  skillId,
  name: fixtureSkillNames.get(skillId)!,
  level,
  evidenceUrl,
});

const base = {
  avatarUrl: null,
  openToInvite: true,
  isSimulated: true,
  portfolio: [],
} satisfies Partial<FixtureProfile>;

export const fixtureProfiles: FixtureProfile[] = [
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000001",
    username: "dinda",
    fullName: "Dinda Putri",
    campus: "ITB",
    major: "DKV",
    entryYear: 2024,
    bio: "Suka merancang aplikasi yang gampang dipakai. Lagi cari tim hackathon yang serius.",
    preferredRoles: ["uiux", "product"],
    hoursPerWeek: 6,
    goal: "win",
    workTime: "night",
    updatedAt: "2026-11-15T10:00:00Z",
    skills: [skill(16, 3, "https://example.com/dinda/figma"), skill(17, 2), skill(18, 2)],
    history: [
      { competitionName: "Hackathon Contoh A", year: 2025, category: "hackathon", role: "UI/UX Designer", result: "finalist", evidenceUrl: "https://example.com/dinda/finalis" },
      { competitionName: "Hackathon Contoh B", year: 2024, category: "hackathon", role: "UI/UX Designer", result: "participant", evidenceUrl: null },
    ],
    portfolio: [
      { title: "Aplikasi antre klinik", description: "Riset dan desain alur antre untuk klinik kampus.", url: "https://example.com/dinda/klinik", skillIds: [16, 17] },
      { title: "Redesain portal mahasiswa", description: "Prototipe portal yang lebih ringkas.", url: "https://example.com/dinda/portal", skillIds: [16, 18] },
    ],
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000002",
    username: "arif_f",
    fullName: "Arif Fadhil",
    campus: "ITB",
    major: "Teknik Informatika",
    entryYear: 2023,
    bio: "Frontend developer yang mulai belajar desain.",
    preferredRoles: ["frontend", "uiux"],
    hoursPerWeek: 10,
    goal: "win",
    workTime: "flexible",
    updatedAt: "2026-11-12T08:00:00Z",
    skills: [skill(16, 2), skill(2, 3, "https://example.com/arif/web"), skill(3, 3)],
    history: [
      { competitionName: "Hackathon Contoh A", year: 2025, category: "hackathon", role: "Frontend Developer", result: "participant", evidenceUrl: null },
    ],
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000003",
    username: "salsa",
    fullName: "Salsabila Rahma",
    campus: "Unpad",
    major: "Psikologi",
    entryYear: 2024,
    bio: "Senang ngobrol dengan pengguna dan menguji desain.",
    preferredRoles: ["uiux"],
    hoursPerWeek: 8,
    goal: "learn",
    workTime: "afternoon",
    updatedAt: "2026-11-10T08:00:00Z",
    skills: [skill(17, 3, "https://example.com/salsa/riset"), skill(16, 1)],
    history: [],
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000004",
    username: "budi",
    fullName: "Budi Santoso",
    campus: "ITB",
    major: "Teknik Informatika",
    entryYear: 2023,
    bio: "Backend dan database. Sudah satu tim dengan Rani.",
    preferredRoles: ["backend"],
    hoursPerWeek: 12,
    goal: "win",
    workTime: "night",
    updatedAt: "2026-11-14T08:00:00Z",
    skills: [skill(1, 3, "https://example.com/budi/api"), skill(6, 3), skill(7, 2)],
    history: [
      { competitionName: "Hackathon Contoh B", year: 2024, category: "hackathon", role: "Backend Developer", result: "winner_2", evidenceUrl: null },
    ],
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000005",
    username: "rani",
    fullName: "Rani Maharani",
    campus: "ITB",
    major: "Sistem dan Teknologi Informasi",
    entryYear: 2023,
    bio: "Ketua tim, frontend dan produk.",
    preferredRoles: ["frontend", "product"],
    hoursPerWeek: 12,
    goal: "win",
    workTime: "night",
    updatedAt: "2026-11-16T08:00:00Z",
    skills: [skill(2, 3), skill(3, 3), skill(30, 2)],
    history: [],
  },
  {
    ...base,
    id: "00000000-0000-4000-8000-000000000006",
    username: "kevin_p",
    fullName: "Kevin Pratama",
    campus: "Binus",
    major: "Manajemen",
    entryYear: 2022,
    bio: "Pernah jadi presenter di dua lomba bisnis.",
    preferredRoles: ["product", "business"],
    hoursPerWeek: 5,
    goal: "win",
    workTime: "night",
    updatedAt: "2026-11-11T08:00:00Z",
    skills: [skill(36, 3, "https://example.com/kevin/pitch"), skill(34, 3), skill(31, 2)],
    history: [
      { competitionName: "Hackathon Contoh C", year: 2025, category: "hackathon", role: "Pitching", result: "participant", evidenceUrl: null },
    ],
  },
];

export const toCandidateInput = (p: FixtureProfile): CandidateInput => ({
  profileId: p.id,
  preferredRoles: p.preferredRoles,
  skills: p.skills.map((s) => ({ skillId: s.skillId, level: s.level, hasEvidence: s.evidenceUrl !== null })),
  hoursPerWeek: p.hoursPerWeek,
  goal: p.goal,
  workTime: p.workTime,
  history: p.history.map((h) => ({ category: h.category, result: h.result })),
  updatedAt: p.updatedAt,
});

const byId = (id: string) => fixtureProfiles.find((p) => p.id === id)!;
const [, , , budi, rani] = fixtureProfiles;

export interface FixtureTeamRole extends RoleRequirement {
  source: "guidebook" | "criteria" | "template" | "manual";
  sourcePage: number | null;
  sourceCriterion: string | null;
  edited: boolean;
  slots: number;
  memberIds: string[];
}

// The scenario of PRD §3.1: Rani leads, Budi fills Backend, UI/UX and Pitching are empty.
export const fixtureTeam = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Tim Rani",
  competition: { slug: "hackathon-contoh", name: "Hackathon Contoh 2026", category: "hackathon" as const, isSimulated: true },
  leaderId: rani.id,
  goal: "win" as const,
  workTime: "night" as const,
  status: "forming" as const,
  members: [
    { profileId: rani.id, teamRoleId: null, isLeader: true },
    { profileId: budi.id, teamRoleId: "20000000-0000-4000-8000-000000000001", isLeader: false },
  ],
  roles: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      name: "Backend Developer",
      colorKey: "backend",
      source: "guidebook",
      sourcePage: 3,
      sourceCriterion: null,
      edited: false,
      requiredSkills: [{ skillId: 1, minLevel: 2 }, { skillId: 6, minLevel: 2 }],
      optionalSkillIds: [7],
      hoursPerWeek: 10,
      slots: 1,
      memberIds: [budi.id],
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      name: "UI/UX Designer",
      colorKey: "uiux",
      source: "criteria",
      sourcePage: 7,
      sourceCriterion: "Desain antarmuka 20%",
      edited: false,
      requiredSkills: [{ skillId: 16, minLevel: 2 }, { skillId: 17, minLevel: 1 }],
      optionalSkillIds: [18],
      hoursPerWeek: 8,
      slots: 1,
      memberIds: [],
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      name: "Product dan Pitching",
      colorKey: "product",
      source: "criteria",
      sourcePage: 8,
      sourceCriterion: "Presentasi 15%",
      edited: false,
      requiredSkills: [{ skillId: 36, minLevel: 2 }, { skillId: 30, minLevel: 1 }],
      optionalSkillIds: [34],
      hoursPerWeek: 6,
      slots: 1,
      memberIds: [],
    },
  ] satisfies FixtureTeamRole[],
};

const teamContext: TeamContext = {
  competitionCategory: fixtureTeam.competition.category,
  goal: fixtureTeam.goal,
  workTime: fixtureTeam.workTime,
};

// Same shape as GET /api/ranking/[teamRoleId] (PRD §13.2).
export function fixtureRanking(teamRoleId: string) {
  const role = fixtureTeam.roles.find((r) => r.id === teamRoleId)!;
  const memberIds = new Set(fixtureTeam.members.map((m) => m.profileId));
  const pool = fixtureProfiles.filter((p) => !memberIds.has(p.id)).map(toCandidateInput);
  const ranked = rankCandidates(role, pool, teamContext, DEFAULT_MATCHING_CONFIG, fixtureSkillNames);
  const name = (id: number) => fixtureSkillNames.get(id)!;

  return {
    role: {
      id: role.id,
      name: role.name,
      colorKey: role.colorKey,
      requiredSkills: role.requiredSkills.map((r) => ({ ...r, name: name(r.skillId) })),
      hoursPerWeek: role.hoursPerWeek,
    },
    total: ranked.length,
    candidates: ranked.map((r) => {
      const p = byId(r.profileId);
      const own = (id: number) => p.skills.find((s) => s.skillId === id)!;
      return {
        profile: {
          id: p.id,
          username: p.username,
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
          campus: p.campus,
          major: p.major,
          entryYear: p.entryYear,
          preferredRoles: p.preferredRoles,
          isSimulated: p.isSimulated,
        },
        score: r.score,
        factors: r.factors,
        weights: DEFAULT_MATCHING_CONFIG.weights,
        matchedRequired: r.matchedRequired.map((id) => ({
          skillId: id,
          name: name(id),
          level: own(id).level,
          hasEvidence: own(id).evidenceUrl !== null,
        })),
        missingRequired: r.missingRequired.map((id) => ({
          skillId: id,
          name: name(id),
          minLevel: role.requiredSkills.find((s) => s.skillId === id)!.minLevel,
        })),
        reasons: r.reasons,
        inviteStatus: null as "pending" | "accepted" | "declined" | null,
      };
    }),
  };
}

export type FixtureRanking = ReturnType<typeof fixtureRanking>;
