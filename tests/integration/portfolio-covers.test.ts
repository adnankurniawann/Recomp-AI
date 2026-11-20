import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES } from "@/lib/validation/upload";
import { admin, createStudent, deleteStudents, hasLocalDb, type Student } from "./supabase";

// F-PRF-04: covers live in the `portfolio` bucket under the owner's profile id (migration 0003).
describe.skipIf(!hasLocalDb)("portfolio cover storage", () => {
  let a: Student;
  let b: Student;
  const uploaded: string[] = [];

  beforeAll(async () => {
    [a, b] = await Promise.all([createStudent("eka"), createStudent("fajar")]);
  });

  afterAll(async () => {
    if (uploaded.length) await admin().storage.from("portfolio").remove(uploaded);
    await deleteStudents();
  });

  const png = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: "image/png" });

  it("lets a student upload into their own folder", async () => {
    const path = `${a.profileId}/cover-${Date.now()}.png`;
    const { error } = await a.db.storage
      .from("portfolio")
      .upload(path, png(1024), { contentType: "image/png" });
    expect(error).toBeNull();
    uploaded.push(path);
  });

  it("blocks uploading into another student's folder", async () => {
    const path = `${b.profileId}/cover-${Date.now()}.png`;
    const { error } = await a.db.storage
      .from("portfolio")
      .upload(path, png(1024), { contentType: "image/png" });
    expect(error).not.toBeNull();
  });

  it("blocks images over 2 MB and types other than JPG, PNG and WebP", async () => {
    const big = await a.db.storage
      .from("portfolio")
      .upload(`${a.profileId}/big-${Date.now()}.png`, png(MAX_IMAGE_BYTES + 1), {
        contentType: "image/png",
      });
    expect(big.error).not.toBeNull();

    const gif = await a.db.storage
      .from("portfolio")
      .upload(
        `${a.profileId}/anim-${Date.now()}.gif`,
        new Blob([new Uint8Array(10)], { type: "image/gif" }),
        {
          contentType: "image/gif",
        },
      );
    expect(gif.error).not.toBeNull();
  });
});
