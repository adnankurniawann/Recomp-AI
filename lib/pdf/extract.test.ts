import { describe, expect, it } from "vitest";
import { MAX_CHARS, MAX_PAGES, extractPdfPages, preparePages, toMarkedText } from "./extract";
import { makePdf } from "./make-test-pdf";

const line = "Kriteria penilaian: inovasi 30%, dampak 30%, teknis 25%, presentasi 15%.";

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

describe("extractPdfPages input", () => {
  it("leaves the caller's bytes usable for a second read", async () => {
    const bytes = makePdf([line]);
    await extractPdfPages(bytes);
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect((await extractPdfPages(bytes)).pages[0]?.text).toContain("inovasi");
  });
});
