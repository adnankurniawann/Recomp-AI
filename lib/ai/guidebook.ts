import {
  SCANNED_PDF_MESSAGE,
  TRUNCATED_PDF_WARNING,
  extractPdfPages,
  toMarkedText,
} from "@/lib/pdf/extract";
import {
  GUIDEBOOK_SYSTEM_PROMPT,
  buildGuidebookUserMessage,
  buildRepairMessage,
  type PromptTemplate,
} from "./prompts/guidebook";
import { GUIDEBOOK_JSON_SCHEMA, GuidebookExtraction, describeIssues } from "./schemas";

/** One chat turn sent to the model. */
export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

/** Calls the LLM and returns its raw text. Injected so tests never call Gemini. */
export type GenerateJson = (req: {
  system: string;
  turns: ChatTurn[];
  jsonSchema: unknown;
  signal: AbortSignal;
}) => Promise<string>;

export const GUIDEBOOK_TIMEOUT_MS = 55_000;

export const GUIDEBOOK_ERRORS = {
  unreadable: "PDF guidebook tidak bisa dibaca. Coba unggah ulang file PDF-nya.",
  scanned: SCANNED_PDF_MESSAGE,
  invalid: "Hasil AI tidak sesuai format, bahkan setelah dicoba ulang. Isi role secara manual.",
  timeout: "AI terlalu lama membaca guidebook. Coba jalankan lagi sebentar lagi.",
  failed: "AI gagal membaca guidebook. Coba jalankan lagi sebentar lagi.",
} as const;

export type GuidebookAgentResult =
  | {
      status: "draft";
      data: GuidebookExtraction;
      warnings: string[];
      pageCount: number;
      attempts: 1 | 2;
    }
  | { status: "failed"; error: string; warnings: string[]; pageCount: number | null };

/**
 * Reads a guidebook PDF and asks the LLM for summary, team size, deadlines, criteria and roles
 * (PRD §8.1, F-GBA-01). Never throws: every problem ends as `failed` with an Indonesian message.
 */
export async function runGuidebookAgent(input: {
  pdf: Uint8Array;
  category: string;
  skillNames: string[];
  templates: PromptTemplate[];
  generate: GenerateJson;
  timeoutMs?: number;
}): Promise<GuidebookAgentResult> {
  let text;
  try {
    text = await extractPdfPages(input.pdf);
  } catch {
    return { status: "failed", error: GUIDEBOOK_ERRORS.unreadable, warnings: [], pageCount: null };
  }

  const pageCount = text.totalPages;
  const warnings = text.truncated ? [TRUNCATED_PDF_WARNING] : [];
  if (text.isScanned)
    return { status: "failed", error: GUIDEBOOK_ERRORS.scanned, warnings, pageCount };

  const signal = AbortSignal.timeout(input.timeoutMs ?? GUIDEBOOK_TIMEOUT_MS);
  const turns: ChatTurn[] = [
    {
      role: "user",
      text: buildGuidebookUserMessage({
        category: input.category,
        skillNames: input.skillNames,
        templates: input.templates,
        markedText: toMarkedText(text.pages),
      }),
    },
  ];

  for (const attempt of [1, 2] as const) {
    let raw: string;
    try {
      raw = await input.generate({
        system: GUIDEBOOK_SYSTEM_PROMPT,
        turns,
        jsonSchema: GUIDEBOOK_JSON_SCHEMA,
        signal,
      });
    } catch {
      const error = signal.aborted ? GUIDEBOOK_ERRORS.timeout : GUIDEBOOK_ERRORS.failed;
      return { status: "failed", error, warnings, pageCount };
    }

    const parsed = GuidebookExtraction.safeParse(parseJson(raw));
    if (parsed.success) {
      return {
        status: "draft",
        data: parsed.data,
        warnings: [...warnings, ...parsed.data.warnings],
        pageCount,
        attempts: attempt,
      };
    }
    turns.push(
      { role: "model", text: raw },
      { role: "user", text: buildRepairMessage(describeIssues(parsed.error)) },
    );
  }

  return { status: "failed", error: GUIDEBOOK_ERRORS.invalid, warnings, pageCount };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
