/** Test data: a guidebook extraction that passes the schema. */
export const validExtraction = {
  summary: "Hackathon 48 jam untuk solusi kota pintar.",
  team_size: { min: 3, max: 4, page: 2 },
  deadlines: [{ name: "Pendaftaran", date: "2026-12-01", page: 3 }],
  judging_criteria: [
    { name: "Desain antarmuka", weight_percent: 20, page: 7 },
    { name: "Presentasi", weight_percent: 15, description: "Kejelasan pitch", page: 8 },
  ],
  suggested_roles: [
    {
      name: "UI/UX Designer",
      reason: "Ada kriteria Desain antarmuka 20%.",
      source: "criteria",
      source_criterion: "Desain antarmuka",
      page: 7,
      required_skills: [{ skill: "Figma", min_level: 2 }],
      optional_skills: ["User Research"],
      hours_per_week: 8,
      slots: 1,
    },
    {
      name: "Backend Developer",
      reason: "Guidebook meminta prototipe yang berjalan.",
      source: "guidebook",
      source_criterion: null,
      page: 4,
      required_skills: [{ skill: "Backend Development", min_level: 2 }],
      optional_skills: [],
      hours_per_week: 10,
      slots: 2,
    },
  ],
  warnings: [],
};
