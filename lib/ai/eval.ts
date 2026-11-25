import { createHash } from "node:crypto";
import { z } from "zod";

// Scoring for `pnpm eval:guidebook` (PRD §8.1 "Evaluasi akurasi", §17): how many judging criteria
// the agent found with the right name and the right page, against answers written by hand.

/** Where downloaded guidebooks are kept. Gitignored: third-party PDFs never go in the repo. */
export const PDF_CACHE_DIR = "eval/pdfs";

export const ManualGuidebook = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string(),
    /** Path to the PDF, relative to the repo root. */
    pdf: z.string(),
    /**
     * The organiser's own link, for guidebooks not stored in the repo. `pnpm eval:guidebook`
     * downloads it to `pdf` (under eval/pdfs/) and refuses a file whose hash changed, because the
     * answers below were written for that exact file.
     */
    url: z.url().optional(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    category: z.enum(["hackathon", "it_competition", "ui_ux", "data", "business_case", "paper"]),
    /** Where the answers come from, so anyone can check them. */
    source: z.string(),
    criteria: z
      .array(
        z.object({
          name: z.string(),
          /** PDF page index as the agent sees it ("=== PAGE n ==="). Several when a row spans pages. */
          pages: z.array(z.number().int().positive()).min(1),
          weight_percent: z.number().nullable(),
        }),
      )
      .min(1),
  })
  .refine((b) => !b.url || (b.sha256 && b.pdf.startsWith(`${PDF_CACHE_DIR}/`)), {
    message: `A guidebook with a url needs a sha256 and a pdf path under ${PDF_CACHE_DIR}/`,
  });
export const ManualGuidebooks = z.array(ManualGuidebook);
export type ManualGuidebook = z.infer<typeof ManualGuidebook>;

/** Hex SHA-256 of a file, to check a downloaded guidebook is the one the answers describe. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface ExtractedCriterion {
  name: string;
  page: number | null;
  weight_percent: number | null;
}

export interface CriterionResult {
  expected: string;
  found: string | null;
  nameOk: boolean;
  pageOk: boolean;
  weightOk: boolean;
}

export interface GuidebookScore {
  id: string;
  total: number;
  /** Name and page both right: the PRD's accuracy number. */
  correct: number;
  nameOnly: number;
  /** Criteria the agent returned that match nothing in the manual answer. */
  extra: string[];
  rows: CriterionResult[];
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const tokens = (s: string) =>
  new Set(
    normalizeName(s)
      .split(" ")
      .filter((t) => t.length > 1),
  );

/** Same criterion: equal after normalising, one inside the other, or most words shared. */
export function sameCriterion(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const ta = tokens(a);
  const tb = tokens(b);
  const shared = [...ta].filter((t) => tb.has(t)).length;
  return shared / Math.max(ta.size, tb.size) >= 0.6;
}

/**
 * Matches each manual criterion to at most one extracted criterion: exact names first, then loose
 * ones, so "Feasibility" never takes "Technical Feasibility" while its own row exists. Within each,
 * a row on the right page goes first, so when two rounds share a name ("Presentasi" in the
 * preliminary and the final) each extracted row pairs with the round it came from.
 */
export function scoreGuidebook(
  manual: ManualGuidebook,
  extracted: readonly ExtractedCriterion[],
): GuidebookScore {
  const used = new Set<number>();
  const match = new Map<number, number>(); // manual index -> extracted index
  const exact = (a: string, b: string) => normalizeName(a) === normalizeName(b);
  const onPage = (m: ManualGuidebook["criteria"][number], e: ExtractedCriterion) =>
    e.page !== null && m.pages.includes(e.page);
  const passes = [
    { same: exact, page: true },
    { same: exact, page: false },
    { same: sameCriterion, page: true },
    { same: sameCriterion, page: false },
  ];
  for (const { same, page } of passes) {
    manual.criteria.forEach((m, mi) => {
      if (match.has(mi)) return;
      const i = extracted.findIndex(
        (e, idx) => !used.has(idx) && same(m.name, e.name) && (!page || onPage(m, e)),
      );
      if (i >= 0) {
        used.add(i);
        match.set(mi, i);
      }
    });
  }

  const rows = manual.criteria.map((m, mi): CriterionResult => {
    const i = match.get(mi);
    if (i === undefined) {
      return { expected: m.name, found: null, nameOk: false, pageOk: false, weightOk: false };
    }
    const e = extracted[i]!;
    return {
      expected: m.name,
      found: e.name,
      nameOk: true,
      pageOk: e.page !== null && m.pages.includes(e.page),
      weightOk: m.weight_percent === e.weight_percent,
    };
  });
  return {
    id: manual.id,
    total: rows.length,
    correct: rows.filter((r) => r.nameOk && r.pageOk).length,
    nameOnly: rows.filter((r) => r.nameOk && !r.pageOk).length,
    extra: extracted.filter((_, idx) => !used.has(idx)).map((e) => e.name),
    rows,
  };
}

/** Correct criteria over all manual criteria, across every guidebook that ran. */
export function overallAccuracy(scores: readonly GuidebookScore[]): {
  correct: number;
  total: number;
  percent: number | null;
} {
  const correct = scores.reduce((s, g) => s + g.correct, 0);
  const total = scores.reduce((s, g) => s + g.total, 0);
  return { correct, total, percent: total ? Math.round((correct / total) * 1000) / 10 : null };
}
