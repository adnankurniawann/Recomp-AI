import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createStudent, deleteStudents, hasLocalDb, type Student } from "./supabase";

// F-CMP-04: only admins write competitions, extractions and the guidebooks bucket (RLS, 0003).
describe.skipIf(!hasLocalDb)("admin competition RLS", () => {
  let boss: Student;
  let student: Student;
  const slug = `admin-uji-${randomUUID().slice(0, 8)}`;
  let competitionId: string;
  const pdf = new Blob(["%PDF-1.4\n%%EOF\n"], { type: "application/pdf" });

  beforeAll(async () => {
    [boss, student] = await Promise.all([createStudent("admin"), createStudent("biasa")]);
    const { error } = await admin()
      .from("profiles")
      .update({ app_role: "admin" })
      .eq("id", boss.profileId);
    if (error) throw new Error(error.message);
  });

  afterAll(async () => {
    if (competitionId) {
      await admin()
        .storage.from("guidebooks")
        .remove([`${competitionId}/uji.pdf`]);
      await admin().from("competitions").delete().eq("id", competitionId);
    }
    await deleteStudents();
  });

  it("lets an admin add an unpublished competition that students can't see", async () => {
    const { data, error } = await boss.db
      .from("competitions")
      .insert({
        slug,
        name: "Lomba Admin Uji",
        organizer: "Panitia Uji",
        category: "hackathon",
        is_published: false,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    competitionId = data!.id;
    expect(
      (await student.db.from("competitions").select("id").eq("id", competitionId)).data,
    ).toEqual([]);
  });

  it("refuses competition edits from a student", async () => {
    const res = await student.db
      .from("competitions")
      .update({ name: "Dibajak" })
      .eq("slug", "stack-2026")
      .select();
    expect(res.data ?? []).toEqual([]);
  });

  it("lets only an admin upload a guidebook", async () => {
    const path = `${competitionId}/uji.pdf`;
    const byStudent = await student.db.storage.from("guidebooks").upload(path, pdf);
    expect(byStudent.error).not.toBeNull();
    const byAdmin = await boss.db.storage
      .from("guidebooks")
      .upload(path, pdf, { contentType: "application/pdf" });
    expect(byAdmin.error).toBeNull();
  });

  it("lets only an admin approve an extraction", async () => {
    const { data: x } = await admin()
      .from("competition_extractions")
      .insert({ competition_id: competitionId, status: "draft", data: { summary: "x" } })
      .select("id")
      .single();
    const byStudent = await student.db
      .from("competition_extractions")
      .update({ status: "reviewed" })
      .eq("id", x!.id)
      .select();
    expect(byStudent.data ?? []).toEqual([]);
    const byAdmin = await boss.db
      .from("competition_extractions")
      .update({ status: "reviewed" })
      .eq("id", x!.id)
      .select("status")
      .single();
    expect(byAdmin.data?.status).toBe("reviewed");
  });
});
