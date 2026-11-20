// Image uploads (PRD F-PRF-04, §14): at most 2 MB, JPG, PNG or WebP. The `portfolio` bucket
// enforces the same limits; this check runs first so the student gets a clear message.

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type ImageType = keyof typeof IMAGE_TYPES;

export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");

export type ImageCheck =
  | { ok: true; type: ImageType; ext: (typeof IMAGE_TYPES)[ImageType] }
  | { ok: false; code: "FILE_TOO_LARGE" | "VALIDATION"; message: string };

export function checkImage(file: { size: number; type: string }): ImageCheck {
  if (!(file.type in IMAGE_TYPES)) {
    return { ok: false, code: "VALIDATION", message: "Format gambar harus JPG, PNG, atau WebP." };
  }
  if (file.size === 0) {
    return { ok: false, code: "VALIDATION", message: "File gambar kosong." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, code: "FILE_TOO_LARGE", message: "Ukuran gambar maksimal 2 MB." };
  }
  const type = file.type as ImageType;
  return { ok: true, type, ext: IMAGE_TYPES[type] };
}
