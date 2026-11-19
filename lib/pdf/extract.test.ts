import { describe, expect, it } from "vitest";
import { MAX_CHARS, MAX_PAGES, extractPdfPages, preparePages, toMarkedText } from "./extract";

const line = "Kriteria penilaian: inovasi 30%, dampak 30%, teknis 25%, presentasi 15%.";

/** Builds a minimal text PDF, one Helvetica line per page, with a valid xref table. */
function makePdf(pageTexts: string[]): Uint8Array {
  const n = pageTexts.length;
  const pageIds = pageTexts.map((_, i) => 4 + i * 2);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${n} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (const [i, text] of pageTexts.entries()) {
    const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[i]! + 1} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  }
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

describe("extractPdfPages", () => {
  it("returns the text of each page with 1-based page numbers", async () => {
    const result = await extractPdfPages(makePdf([line, "Ukuran tim: 3 sampai 5 orang per tim."]));
    expect(result.totalPages).toBe(2);
    expect(result.pages.map((p) => p.page)).toEqual([1, 2]);
    expect(result.pages[0]?.text).toContain("inovasi 30%");
    expect(result.pages[1]?.text).toContain("3 sampai 5 orang");
    expect(result.isScanned).toBe(false);
    expect(result.truncated).toBe(false);
  });

  it("flags a PDF with almost no text as scanned", async () => {
    const result = await extractPdfPages(makePdf(["1", "2", "3"]));
    expect(result.isScanned).toBe(true);
  });

  it("rejects bytes that are not a PDF", async () => {
    await expect(extractPdfPages(new TextEncoder().encode("bukan pdf"))).rejects.toThrow();
  });
});

describe("preparePages", () => {
  it("collapses spaces and blank lines", () => {
    const { pages } = preparePages(["  Deadline:  30   November \n\n\n\nPukul 23.59  "]);
    expect(pages[0]?.text).toBe("Deadline: 30 November\n\nPukul 23.59");
  });

  it("uses the average over all pages for the scan check", () => {
    expect(preparePages(["x".repeat(49), "x".repeat(49)]).isScanned).toBe(true);
    expect(preparePages(["x".repeat(100), ""]).isScanned).toBe(false);
    expect(preparePages([]).isScanned).toBe(true);
  });

  it("keeps the first 60 pages and marks the result truncated", () => {
    const result = preparePages(Array.from({ length: 70 }, () => line));
    expect(result.pages).toHaveLength(MAX_PAGES);
    expect(result.totalPages).toBe(70);
    expect(result.truncated).toBe(true);
  });

  it("cuts at 120,000 characters in total", () => {
    const result = preparePages(Array.from({ length: 5 }, () => "x".repeat(50_000)));
    const total = result.pages.reduce((sum, p) => sum + p.text.length, 0);
    expect(total).toBe(MAX_CHARS);
    expect(result.pages).toHaveLength(3);
    expect(result.pages[2]?.text).toHaveLength(20_000);
    expect(result.truncated).toBe(true);
  });

  it("does not mark a guidebook within the limits as truncated", () => {
    expect(preparePages([line, line]).truncated).toBe(false);
  });
});

describe("toMarkedText", () => {
  it("puts a page marker before each page", () => {
    expect(
      toMarkedText([
        { page: 1, text: "Halo" },
        { page: 2, text: "Dunia" },
      ]),
    ).toBe("=== PAGE 1 ===\nHalo\n\n=== PAGE 2 ===\nDunia");
  });
});
