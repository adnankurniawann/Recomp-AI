import { describe, expect, it } from "vitest";
import { checkImage, checkPdf, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "./upload";

describe("checkImage", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s", (type, ext) => {
    expect(checkImage({ size: 1000, type })).toEqual({ ok: true, type, ext });
  });

  it("accepts exactly 2 MB and rejects one byte more with FILE_TOO_LARGE", () => {
    expect(checkImage({ size: MAX_IMAGE_BYTES, type: "image/png" }).ok).toBe(true);
    const tooBig = checkImage({ size: MAX_IMAGE_BYTES + 1, type: "image/png" });
    expect(tooBig).toMatchObject({
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Ukuran gambar maksimal 2 MB.",
    });
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", ""])("rejects %s", (type) => {
    expect(checkImage({ size: 1000, type })).toMatchObject({ ok: false, code: "VALIDATION" });
  });

  it("rejects an empty file", () => {
    expect(checkImage({ size: 0, type: "image/png" })).toMatchObject({
      ok: false,
      code: "VALIDATION",
    });
  });
});

describe("checkPdf", () => {
  it("accepts a PDF up to 20 MB", () => {
    expect(checkPdf({ type: "application/pdf", size: MAX_PDF_BYTES })).toEqual({ ok: true });
  });

  it("refuses another type, an empty file and a file over 20 MB", () => {
    expect(checkPdf({ type: "image/png", size: 10 })).toMatchObject({ code: "VALIDATION" });
    expect(checkPdf({ type: "application/pdf", size: 0 })).toMatchObject({ code: "VALIDATION" });
    expect(checkPdf({ type: "application/pdf", size: MAX_PDF_BYTES + 1 })).toMatchObject({
      code: "FILE_TOO_LARGE",
    });
  });
});
