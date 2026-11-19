import { Faker, base, en, id_ID } from "@faker-js/faker";
import type { CompCategory, CompResult, Goal, PreferredRoleKey, WorkTime } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import type { TablesInsert } from "@/lib/supabase/types";

/**
 * Simulated profiles for `pnpm seed:profiles` (PRD §15). Pure: the same count and seed give the
 * same rows, so the demo looks the same on every machine.
 */

export interface SeedSkill {
  id: number;
  slug: string;
}

export interface SeedRows {
  profiles: TablesInsert<"profiles">[];
  contacts: TablesInsert<"profile_contacts">[];
  skills: TablesInsert<"profile_skills">[];
  history: TablesInsert<"competition_history">[];
  portfolio: TablesInsert<"portfolio_items">[];
  interests: TablesInsert<"competition_interests">[];
}

// Skill slugs a student in each role would list (seed.sql). Unknown slugs are skipped.
const ROLE_SKILLS: Record<PreferredRoleKey, string[]> = {
  backend: [
    "backend-development",
    "nodejs",
    "database",
    "api-design",
    "cloud-deployment",
    "typescript",
    "git",
    "algorithms",
    "cybersecurity",
  ],
  frontend: [
    "frontend-development",
    "react",
    "nextjs",
    "typescript",
    "tailwind-css",
    "git",
    "mobile-development",
    "flutter",
  ],
  uiux: ["figma", "user-research", "prototyping", "design-system", "ui-design", "illustration"],
  data: [
    "python",
    "machine-learning",
    "data-analysis",
    "llm-integration",
    "computer-vision",
    "sql",
    "data-visualization",
    "statistics",
  ],
  product: [
    "product-management",
    "market-research",
    "pitch-deck",
    "public-speaking",
    "copywriting",
    "video-editing",
  ],
  business: [
    "business-model",
    "market-research",
    "financial-modeling",
    "business-strategy",
    "pitch-deck",
    "public-speaking",
    "academic-writing",
    "literature-review",
  ],
};

// PRD §15: 30% engineering, 25% design, 20% data/AI, 25% product and communication.
const PRIMARY_ROLE_WEIGHTS: { value: PreferredRoleKey; weight: number }[] = [
  { value: "backend", weight: 15 },
  { value: "frontend", weight: 15 },
  { value: "uiux", weight: 25 },
  { value: "data", weight: 20 },
  { value: "product", weight: 13 },
  { value: "business", weight: 12 },
];

const MAJORS: Record<PreferredRoleKey, string[]> = {
  backend: ["Teknik Informatika", "Sistem Informasi", "Ilmu Komputer"],
  frontend: ["Teknik Informatika", "Sistem Informasi", "Ilmu Komputer"],
  uiux: ["Desain Komunikasi Visual", "Desain Produk", "Sistem Informasi", "Psikologi"],
  data: ["Statistika", "Matematika", "Sains Data", "Teknik Informatika"],
  product: ["Manajemen", "Teknik Industri", "Ilmu Komunikasi", "Sistem Informasi"],
  business: ["Manajemen", "Akuntansi", "Ekonomi Pembangunan", "Teknik Industri"],
};

const BIOS: Record<PreferredRoleKey, string[]> = {
  backend: [
    "Suka merancang API dan database yang rapi.",
    "Backend developer yang senang bikin sistem yang tahan beban.",
  ],
  frontend: [
    "Senang bikin tampilan web yang cepat dan enak dipakai.",
    "Frontend developer, lagi mendalami React dan Next.js.",
  ],
  uiux: [
    "Suka merancang aplikasi yang gampang dipakai.",
    "Desainer UI/UX yang senang ngobrol dengan pengguna.",
  ],
  data: [
    "Tertarik mengolah data jadi keputusan.",
    "Lagi belajar machine learning dan suka eksperimen model.",
  ],
  product: [
    "Suka merumuskan masalah dan menyusun pitch yang meyakinkan.",
    "Senang menjembatani tim teknis dan juri.",
  ],
  business: [
    "Tertarik menyusun model bisnis dan riset pasar.",
    "Suka studi kasus bisnis dan analisis keuangan.",
  ],
};

const CAMPUSES = [
  "ITB",
  "UI",
  "UGM",
  "ITS",
  "Unpad",
  "IPB",
  "Undip",
  "Unair",
  "Telkom University",
  "Binus",
];

const ROLE_CATEGORIES: Record<PreferredRoleKey, CompCategory[]> = {
  backend: ["hackathon", "it_competition"],
  frontend: ["hackathon", "it_competition"],
  uiux: ["ui_ux", "hackathon"],
  data: ["data", "hackathon", "paper"],
  product: ["hackathon", "business_case"],
  business: ["business_case", "paper"],
};

const COMPETITION_NAMES: Record<CompCategory, string[]> = {
  hackathon: ["Hackathon Kampus", "Hackathon Smart City", "Hackathon Kesehatan Digital"],
  it_competition: ["Lomba Pemrograman Nasional", "Kompetisi Web Mahasiswa"],
  ui_ux: ["Kompetisi Desain UI/UX", "Lomba Desain Aplikasi"],
  data: ["Kompetisi Sains Data", "Lomba Analisis Data"],
  business_case: ["Kompetisi Business Case", "Lomba Rencana Bisnis"],
  paper: ["Lomba Karya Tulis Ilmiah", "Kompetisi Esai Nasional"],
};

const PORTFOLIO_TITLES: Record<PreferredRoleKey, string[]> = {
  backend: ["API pemesanan tiket", "Sistem antrean klinik", "Layanan notifikasi"],
  frontend: ["Dashboard UMKM", "Web profil organisasi", "Aplikasi daftar tugas"],
  uiux: ["Redesain aplikasi transportasi", "Studi kasus aplikasi donasi", "Design system kampus"],
  data: ["Prediksi harga rumah", "Analisis sentimen ulasan", "Deteksi penyakit daun"],
  product: ["Pitch deck aplikasi edukasi", "Riset pengguna aplikasi kos", "Roadmap produk startup"],
  business: ["Model bisnis kedai kopi", "Analisis pasar e-commerce", "Rencana keuangan UMKM"],
};

const LEVEL_WEIGHTS = [
  { value: 1, weight: 15 },
  { value: 2, weight: 35 },
  { value: 3, weight: 35 },
  { value: 4, weight: 15 },
];
const RESULT_WEIGHTS: { value: CompResult; weight: number }[] = [
  { value: "participant", weight: 50 },
  { value: "finalist", weight: 25 },
  { value: "honorable", weight: 10 },
  { value: "winner_3", weight: 6 },
  { value: "winner_2", weight: 5 },
  { value: "winner_1", weight: 4 },
];
const GOALS: Goal[] = ["win", "learn"];
const WORK_TIMES: WorkTime[] = ["morning", "afternoon", "night", "flexible"];
const ALL_ROLES = Object.keys(ROLE_SKILLS) as PreferredRoleKey[];

export function generateProfiles(opts: {
  count: number;
  skills: SeedSkill[];
  competitionIds: string[];
  seed?: number;
}): SeedRows {
  const f = new Faker({ locale: [id_ID, en, base] });
  f.seed(opts.seed ?? 2026);
  const skillIdBySlug = new Map(opts.skills.map((s) => [s.slug, s.id]));
  const usernames = new Set<string>();
  const rows: SeedRows = {
    profiles: [],
    contacts: [],
    skills: [],
    history: [],
    portfolio: [],
    interests: [],
  };

  for (let i = 0; i < opts.count; i++) {
    const id = f.string.uuid();
    const first = f.person.firstName();
    const last = f.person.lastName();
    const username = uniqueUsername(`${first}${last}`, usernames, f);
    const primary = f.helpers.weightedArrayElement(PRIMARY_ROLE_WEIGHTS);
    const extra = f.helpers.weightedArrayElement([
      { value: 0, weight: 40 },
      { value: 1, weight: 45 },
      { value: 2, weight: 15 },
    ]);
    const roles = [
      primary,
      ...f.helpers.arrayElements(
        ALL_ROLES.filter((r) => r !== primary),
        extra,
      ),
    ];

    rows.profiles.push({
      id,
      username,
      full_name: `${first} ${last}`,
      campus: f.helpers.arrayElement(CAMPUSES),
      major: f.helpers.arrayElement(MAJORS[primary]),
      entry_year: f.number.int({ min: 2021, max: 2025 }),
      bio: f.helpers.arrayElement(BIOS[primary]),
      preferred_roles: roles,
      hours_per_week: f.helpers.arrayElement([4, 6, 8, 10, 12, 15, 20]),
      goal: f.helpers.arrayElement(GOALS),
      work_time: f.helpers.arrayElement(WORK_TIMES),
      open_to_invite: f.datatype.boolean(0.9),
      onboarding_done: true,
      is_simulated: true,
    });

    rows.contacts.push({
      profile_id: id,
      whatsapp: `+628${f.string.numeric({ length: { min: 8, max: 11 } })}`,
      contact_email: `${username}@example.com`,
    });

    // 2–4 skills for the primary role, 1–2 for each extra role, so roles match skills.
    const picked = new Map<number, string>();
    for (const [n, role] of roles.entries()) {
      const pool = ROLE_SKILLS[role].filter((s) => skillIdBySlug.has(s));
      const take = n === 0 ? f.number.int({ min: 2, max: 4 }) : f.number.int({ min: 1, max: 2 });
      for (const slug of f.helpers.arrayElements(pool, Math.min(take, pool.length))) {
        picked.set(skillIdBySlug.get(slug)!, slug);
      }
    }
    for (const [skillId, slug] of picked) {
      rows.skills.push({
        profile_id: id,
        skill_id: skillId,
        level: f.helpers.weightedArrayElement(LEVEL_WEIGHTS),
        evidence_url: f.datatype.boolean(0.4) ? `https://example.com/${username}/${slug}` : null,
      });
    }

    for (let h = f.number.int({ min: 0, max: 4 }); h > 0; h--) {
      const category = f.helpers.arrayElement(ROLE_CATEGORIES[primary]);
      rows.history.push({
        profile_id: id,
        competition_name: f.helpers.arrayElement(COMPETITION_NAMES[category]),
        year: f.number.int({ min: 2022, max: 2025 }),
        category,
        role: ROLE_LABELS[primary],
        result: f.helpers.weightedArrayElement(RESULT_WEIGHTS),
      });
    }

    const titles = f.helpers.arrayElements(
      PORTFOLIO_TITLES[primary],
      f.number.int({ min: 0, max: 3 }),
    );
    for (const [sort, title] of titles.entries()) {
      rows.portfolio.push({
        profile_id: id,
        title,
        url: `https://example.com/${username}/portofolio-${sort + 1}`,
        skill_ids: f.helpers.arrayElements([...picked.keys()], {
          min: 1,
          max: Math.min(2, picked.size),
        }),
        sort,
      });
    }

    if (opts.competitionIds.length > 0) {
      for (const competitionId of f.helpers.arrayElements(opts.competitionIds, {
        min: 1,
        max: Math.min(3, opts.competitionIds.length),
      })) {
        rows.interests.push({ profile_id: id, competition_id: competitionId });
      }
    }
  }

  return rows;
}

/** Lowercase letters only, at most 20 characters (the `profiles.username` check), deduplicated. */
function uniqueUsername(name: string, taken: Set<string>, f: Faker): string {
  const root = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z]/g, "")
    .slice(0, 16)
    .padEnd(3, "x");
  let username = root;
  while (taken.has(username)) username = `${root}${f.string.numeric(3)}`;
  taken.add(username);
  return username;
}
