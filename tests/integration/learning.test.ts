import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createStudent, deleteStudents, hasLocalDb, type Student } from "./supabase";

// F-LRN-03, F-LRN-05 and PRD §16.2 no. 5 and 6: migration 0005.
describe.skipIf(!hasLocalDb)("learning", () => {
  let s: Student;
  let other: Student;
  const ids = {
    course: randomUUID(),
    ch1: randomUUID(),
    ch2: randomUUID(),
    free: randomUUID(), // chapter 1, two questions
    reading: randomUUID(), // chapter 1, no questions
    paid: randomUUID(), // chapter 2, one question
    q1: randomUUID(),
    q2: randomUUID(),
    q3: randomUUID(),
  };
  const promo = `TES${randomUUID().slice(0, 6).toUpperCase()}`;

  const mcq = (id: string, lesson: string, sort: number) => ({
    id,
    lesson_id: lesson,
    type: "mcq" as const,
    prompt_md: "Pilih yang benar",
    options: [
      { key: "A", text: "Benar" },
      { key: "B", text: "Salah" },
    ],
    answer_key: "A",
    explanation_md: "A benar karena tes.",
    points: 5,
    sort,
  });

  beforeAll(async () => {
    [s, other] = await Promise.all([createStudent("belajar"), createStudent("lain")]);
    const db = admin();
    const steps = [
      db.from("courses").insert({
        id: ids.course,
        slug: `tes-${ids.course.slice(0, 8)}`,
        title: "Kursus Tes",
        category: "hackathon",
        price: 49000,
      }),
      db.from("chapters").insert([
        { id: ids.ch1, course_id: ids.course, title: "Bab 1", sort: 1 },
        { id: ids.ch2, course_id: ids.course, title: "Bab 2", sort: 2 },
      ]),
      db.from("lessons").insert([
        {
          id: ids.free,
          chapter_id: ids.ch1,
          slug: "gratis",
          title: "Gratis",
          content_md: "isi",
          is_free_preview: true,
          sort: 1,
        },
        {
          id: ids.reading,
          chapter_id: ids.ch1,
          slug: "bacaan",
          title: "Bacaan",
          content_md: "isi",
          is_free_preview: true,
          sort: 2,
        },
        {
          id: ids.paid,
          chapter_id: ids.ch2,
          slug: "berbayar",
          title: "Berbayar",
          content_md: "isi",
          is_free_preview: false,
          sort: 1,
        },
      ]),
      db
        .from("questions")
        .insert([mcq(ids.q1, ids.free, 1), mcq(ids.q2, ids.free, 2), mcq(ids.q3, ids.paid, 1)]),
      db.from("promo_codes").insert({ code: promo, discount_percent: 100, quota: 1 }),
    ];
    for (const step of steps) {
      const { error } = await step;
      if (error) throw new Error(error.message);
    }
  });

  afterAll(async () => {
    await admin().from("promo_codes").delete().like("code", "TES%");
    await admin().from("courses").delete().eq("id", ids.course);
    await deleteStudents();
  });

  const submit = (who: Student, question: string, choice: string) =>
    who.db.rpc("submit_mcq", { p_question: question, p_choice: choice });

  it("never shows answer_key to students (PRD §16.2 no. 5)", async () => {
    const pub = await anon().from("questions_public").select("*").eq("lesson_id", ids.free);
    expect(pub.data).toHaveLength(2);
    expect(pub.data?.[0]).not.toHaveProperty("answer_key");
    expect(pub.data?.[0]).not.toHaveProperty("explanation_md");

    expect((await s.db.from("questions").select("answer_key").eq("id", ids.q1)).data).toEqual([]);
    expect((await anon().from("questions").select("answer_key")).data ?? []).toEqual([]);
  });

  it("scores an answer, gives the key afterwards, and refuses a second answer (PRD §16.2 no. 6)", async () => {
    const first = await submit(s, ids.q1, "b");
    expect(first.error).toBeNull();
    expect(first.data).toMatchObject({
      is_correct: false,
      answer_key: "A",
      explanation_md: "A benar karena tes.",
      points_awarded: 0,
      lesson_completed: false,
    });
    expect((await submit(s, ids.q1, "A")).error?.message).toBe("ALREADY_ANSWERED");

    const keys = await s.db.rpc("answered_question_keys", { p_lesson: ids.free });
    expect(keys.data?.map((k) => k.question_id)).toEqual([ids.q1]);
  });

  it("lets only one of two simultaneous answers through", async () => {
    const results = await Promise.all([submit(other, ids.q1, "A"), submit(other, ids.q1, "B")]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.find((r) => r.error)?.error?.message).toBe("ALREADY_ANSWERED");
  });

  it("awards points and completes the lesson once every question is answered", async () => {
    const second = await submit(s, ids.q2, "A");
    expect(second.data).toMatchObject({
      is_correct: true,
      points_awarded: 5,
      lesson_completed: true,
    });

    const done = await s.db.from("lesson_progress").select("lesson_id").eq("lesson_id", ids.free);
    expect(done.data).toHaveLength(1);

    const progress = await s.db.rpc("course_progress", { p_course: ids.course });
    expect(progress.data).toMatchObject({
      answered: 2,
      total_questions: 3,
      points: 5,
      completed_lessons: 1,
      total_lessons: 3,
      has_access: false,
    });
  });

  it("completes a lesson without questions on reading, but not one with questions", async () => {
    expect((await s.db.rpc("complete_reading_lesson", { p_lesson: ids.reading })).error).toBeNull();
    const mixed = await s.db.rpc("complete_reading_lesson", { p_lesson: ids.paid });
    expect(mixed.error?.message).toBe("NO_ACCESS");
  });

  it("locks paid lessons until a simulated purchase (F-LRN-05)", async () => {
    expect((await submit(s, ids.q3, "A")).error?.message).toBe("NO_ACCESS");
    expect((await s.db.rpc("simulate_course_purchase", { p_course: ids.course })).error).toBeNull();
    expect((await submit(s, ids.q3, "A")).data).toMatchObject({ is_correct: true });

    const access = await s.db.from("course_access").select("source").eq("course_id", ids.course);
    expect(access.data).toEqual([{ source: "simulated_payment" }]);
  });

  it("checks promo codes: unknown, quota, expiry, and no second use", async () => {
    const redeem = (code: string) =>
      other.db.rpc("redeem_promo", { p_code: code, p_course: ids.course });

    expect((await redeem("TIDAKADA")).error?.message).toBe("INVALID_CODE");

    await admin()
      .from("promo_codes")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("code", promo);
    expect((await redeem(promo)).error?.message).toBe("EXPIRED");
    await admin().from("promo_codes").update({ expires_at: null }).eq("code", promo);

    expect((await redeem(promo.toLowerCase())).error).toBeNull();
    expect((await redeem(promo)).error).toBeNull(); // already open: no second use
    const { data } = await admin().from("promo_codes").select("used").eq("code", promo).single();
    expect(data?.used).toBe(1);

    expect(
      (await s.db.rpc("redeem_promo", { p_code: promo, p_course: ids.course })).error,
    ).toBeNull(); // s already has access
    const fresh = await createStudent("promo");
    expect(
      (await fresh.db.rpc("redeem_promo", { p_code: promo, p_course: ids.course })).error?.message,
    ).toBe("QUOTA_EXCEEDED");
  });

  it("can't grant itself access, points or progress through the API", async () => {
    const forged = await other.db
      .from("course_access")
      .insert({ profile_id: other.profileId, course_id: ids.course, source: "admin" });
    expect(forged.error).not.toBeNull();

    const attempt = await other.db.from("attempts").insert({
      profile_id: other.profileId,
      question_id: ids.q2,
      answer: { choice: "A" },
      is_correct: true,
      points_awarded: 50,
    });
    expect(attempt.error).not.toBeNull();

    const read = await other.db.from("attempts").select("profile_id").eq("question_id", ids.q1);
    expect(read.data?.every((a) => a.profile_id === other.profileId)).toBe(true);
  });
});
