import { extractText } from "unpdf";

// Input limits for the guidebook agent (PRD §8.1).
export const MAX_PAGES = 60;
export const MAX_CHARS = 120_000;
/** Below this average per page, the PDF is treated as a scan (F-GBA-01). */
export const MIN_AVG_CHARS_PER_PAGE = 50;

export const SCANNED_PDF_MESSAGE =
  "Guidebook berupa gambar. Isi role secara manual atau unggah PDF berbasis teks";
export const TRUNCATED_PDF_WARNING = `Guidebook terlalu panjang, jadi hanya ${MAX_PAGES} halaman atau ${MAX_CHARS.toLocaleString("id-ID")} karakter pertama yang dibaca.`;

export interface PdfPage {
  /** 1-based, as printed in the guidebook viewer. */
  page: number;
  text: string;
}

export interface PdfText {
  pages: PdfPage[];
  totalPages: number;
  /** True when pages or characters past the limits were cut. */
  truncated: boolean;
  /** True when the average text per page is under the scan threshold. */
  isScanned: boolean;
}

/** Reads a PDF and returns its text per page, cut to the agent's limits. Throws on a broken PDF. */
export async function extractPdfPages(data: Uint8Array): Promise<PdfText> {
  const { text } = await extractText(data, { mergePages: false });
  return preparePages(text);
}

/** Normalizes raw page text, flags scans and applies the page and character limits. */
export function preparePages(rawPages: string[]): PdfText {
  const all = rawPages.map(normalize);
  const totalChars = all.reduce((sum, t) => sum + t.length, 0);
  const isScanned = all.length === 0 || totalChars / all.length < MIN_AVG_CHARS_PER_PAGE;

  const pages: PdfPage[] = [];
  let used = 0;
  let truncated = all.length > MAX_PAGES;
  for (const [i, text] of all.slice(0, MAX_PAGES).entries()) {
    const room = MAX_CHARS - used;
    if (room <= 0) {
      truncated = true;
      break;
    }
    const kept = text.length > room ? text.slice(0, room) : text;
    if (kept.length < text.length) truncated = true;
    pages.push({ page: i + 1, text: kept });
    used += kept.length;
  }

  return { pages, totalPages: all.length, truncated, isScanned };
}

/** Joins pages with `=== PAGE n ===` markers so the LLM can cite page numbers. */
export function toMarkedText(pages: PdfPage[]): string {
  return pages.map((p) => `=== PAGE ${p.page} ===\n${p.text}`).join("\n\n");
}

function normalize(text: string): string {
  return text
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
