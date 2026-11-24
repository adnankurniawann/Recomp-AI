import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createStudent, deleteStudents, hasLocalDb, type Student } from "./supabase";

const feedback = {
  scores: [
    {
      criterion: "Masalah jelas",
      score: 4,
      max_score: 5,
      quote: null,
      comment: "Cukup jelas.",
      suggestion: "Tambahkan data.",
    },
  ],
  overall: "Bagus.",
};

// F-LRN-04: record_case_attempt and the agent_actions policies of migration 0014.
describe.skipIf(!hasLocalDb)("case-study attempts", () => {
  let s: Student;
  let other: Student;
  const ids = {
    course: randomUUID(),
    ch1: randomUUID(),
    ch2: randomUUID(),
    free: randomUUID(),
    paid: randomUUID(),
    caseFree: randomUUID(),
    casePaid: randomUUID(),
    mcq: randomUUID(),
  };

  const caseQ = (id: string, lesson: string, sort: number) => ({
    id,
    lesson_id: lesson,
    type: "case" as const,
    prompt_md: "Tulis problem statement.",
    rubric: [{ criterion: "Masalah jelas", description: "Siapa dan apa", max_score: 5 }],
    points: 10,
    sort,
  });

  beforeAll(async () => {
    [s, other] = await Promise.all([createStudent("kasus"), createStudent("lain")]);
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
          slug: "g",
          title: "G",
          content_md: "isi",
          is_free_preview: true,
          sort: 1,
        },
        {
          id: ids.paid,
          chapter_id: ids.ch2,
          slug: "b",
          title: "B",
          content_md: "isi",
          is_free_preview: false,
          sort: 1,
        },
      ]),
      db.from("questions").insert([
        caseQ(ids.caseFree, ids.free, 1),
        caseQ(ids.casePaid, ids.paid, 1),
        {
          id: ids.mcq,
          lesson_id: ids.paid,
          type: "mcq" as const,
          prompt_md: "Pilih",
          options: [{ key: "A", text: "A" }],
          answer_key: "A",
          points: 5,
          sort: 2,
        },
      ]),
    ];
    for (const step of steps) {
      const { error } = await step;
      if (error) throw new Error(error.message);
    }
  });

  afterAll(async () => {
    await admin().from("courses").delete().eq("id", ids.course);
    await deleteStudents();
  });

  const record = (by: Student, question = ids.caseFree, score = 0.8, text = "Jawaban saya.") =>
    by.db.rpc("record_case_attempt", {
      p_question: question,
      p_text: text,
      p_feedback: feedback,
      p_score: score,
    });

  it("stores up to 3 attempts; points only on the first; the lesson completes", async () => {
    const first = await record(s);
    expect(first.error).toBeNull();
    expect(first.data).toEqual({ attempt_no: 1, points_awarded: 10, lesson_completed: true });

    expect((await record(s, ids.caseFree, 1)).data).toMatchObject({
      attempt_no: 2,
      points_awarded: 0,
    });
    expect((await record(s)).data).toMatchObject({ attempt_no: 3, points_awarded: 0 });
    expect((await record(s)).error?.message).toBe("MAX_ATTEMPTS");

    const { data: rows } = await s.db
      .from("attempts")
      .select("attempt_no, score, answer, ai_feedback")
      .eq("question_id", ids.caseFree)
      .order("attempt_no");
    expect(rows?.map((r) => r.attempt_no)).toEqual([1, 2, 3]);
    expect(rows?.[0]?.answer).toEqual({ text: "Jawaban saya." });
    expect(rows?.[0]?.ai_feedback).toEqual(feedback);

    // Another student sees none of it.
    expect(
      (await other.db.from("attempts").select("id").eq("question_id", ids.caseFree)).data,
    ).toEqual([]);
  });

  it("refuses a locked lesson, a multiple-choice question and bad input", async () => {
    expect((await record(other, ids.casePaid)).error?.message).toBe("NO_ACCESS");
    expect((await record(other, ids.mcq)).error?.message).toBe("VALIDATION");
    expect((await record(other, ids.caseFree, 1.5)).error?.message).toBe("VALIDATION");
    expect((await record(other, ids.caseFree, 0.5, "   ")).error?.message).toBe("VALIDATION");
    expect((await record(other, ids.caseFree, 0.5, "a".repeat(2001))).error?.message).toBe(
      "VALIDATION",
    );
    expect(
      (
        await anon().rpc("record_case_attempt", {
          p_question: ids.caseFree,
          p_text: "x",
          p_feedback: feedback,
          p_score: 0.5,
        })
      ).error,
    ).not.toBeNull();
  });

  it("lets students read and write only their own agent_actions", async () => {
    const mine = await s.db
      .from("agent_actions")
      .insert({ agent: "case_feedback", actor_id: s.profileId, approval: "auto" })
      .select("id")
      .single();
    expect(mine.error).toBeNull();

    const forged = await s.db
      .from("agent_actions")
      .insert({ agent: "case_feedback", actor_id: other.profileId, approval: "auto" });
    expect(forged.error).not.toBeNull();

    expect(
      (await other.db.from("agent_actions").select("id").eq("id", mine.data!.id)).data,
    ).toEqual([]);
    expect(
      (await s.db.from("agent_actions").select("id").eq("id", mine.data!.id)).data,
    ).toHaveLength(1);

    await other.db.from("agent_actions").update({ approval: "approved" }).eq("id", mine.data!.id);
    const { data: after } = await admin()
      .from("agent_actions")
      .select("approval")
      .eq("id", mine.data!.id)
      .single();
    expect(after?.approval).toBe("auto");
  });
});
