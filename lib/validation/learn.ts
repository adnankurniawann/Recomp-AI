import { z } from "zod";
import { uuid } from "./common";

// Learning inputs (PRD §13.1: submitMcq, redeemPromo, simulatePurchase; F-LRN-03, F-LRN-05).

export const submitMcqSchema = z.object({
  questionId: uuid,
  choice: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(["A", "B", "C", "D", "E"], "Pilih salah satu jawaban")),
});
export type SubmitMcqInput = z.input<typeof submitMcqSchema>;

export const redeemPromoSchema = z.object({
  courseId: uuid,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Masukkan kode promo")
    .max(40, "Kode promo terlalu panjang"),
});
export type RedeemPromoInput = z.input<typeof redeemPromoSchema>;

export const courseIdSchema = z.object({ courseId: uuid });
export const lessonIdSchema = z.object({ lessonId: uuid });

/** POST /api/ai/case-feedback (PRD §13.2, F-LRN-04). The textarea allows 2,000 characters. */
export const CASE_ANSWER_MIN = 20;
export const CASE_ANSWER_MAX = 2000;

export const caseFeedbackSchema = z.object({
  questionId: uuid,
  answer: z
    .string()
    .trim()
    .min(CASE_ANSWER_MIN, `Jawaban minimal ${CASE_ANSWER_MIN} karakter`)
    .max(CASE_ANSWER_MAX, `Jawaban maksimal ${CASE_ANSWER_MAX.toLocaleString("id-ID")} karakter`),
});
export type CaseFeedbackInput = z.input<typeof caseFeedbackSchema>;
