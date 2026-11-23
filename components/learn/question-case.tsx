"use client";

import { Info, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { CaseFeedback } from "@/lib/ai/schemas";
import { formatScore } from "@/lib/learn/case";
import type { PlayerQuestion } from "@/lib/learn/queries";
import { CASE_ANSWER_MAX, CASE_ANSWER_MIN } from "@/lib/validation/learn";
import { cn } from "@/lib/utils";
import { LessonMarkdown } from "./lesson-markdown";

export const MAX_CASE_ATTEMPTS = 3;
export const AI_NOTE = "Feedback dibuat AI dan bisa keliru.";

interface Graded {
  attemptNo: number;
  feedback: CaseFeedback;
}

function readStored(question: PlayerQuestion): Graded | null {
  const parsed = CaseFeedback.safeParse(question.attempt?.aiFeedback);
  return question.attempt && parsed.success
    ? { attemptNo: question.attempt.attemptNo, feedback: parsed.data }
    : null;
}

/**
 * A case-study question (F-LRN-04, PRD §8.3, §10.7): the task, the rubric, a 2,000-character
 * answer and "Kirim untuk dinilai". The AI feedback comes back per rubric criterion with a quote,
 * a comment and one suggestion. Up to 3 submissions; the latest answer and feedback stay.
 */
export function QuestionCase({ question, number }: { question: PlayerQuestion; number: number }) {
  const router = useRouter();
  const id = useId();
  const [answer, setAnswer] = useState(question.attempt?.text ?? "");
  const [graded, setGraded] = useState<Graded | null>(() => readStored(question));
  const [used, setUsed] = useState(question.attempt?.attemptNo ?? 0);
  const [pending, setPending] = useState(false);

  const left = MAX_CASE_ATTEMPTS - used;
  const length = answer.trim().length;
  const tooShort = length < CASE_ANSWER_MIN;

  async function send() {
    if (pending || left <= 0 || tooShort) return;
    setPending(true);
    try {
      const res = await fetch("/api/ai/case-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answer }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error?.message ?? "Jawaban belum bisa dinilai. Coba lagi.");
        if (body?.error?.code === "MAX_ATTEMPTS") setUsed(MAX_CASE_ATTEMPTS);
        return;
      }
      const feedback = CaseFeedback.parse(body.feedback);
      setGraded({ attemptNo: body.attemptNo, feedback });
      setUsed(body.attemptNo);
      toast.success(
        body.pointsAwarded > 0 ? `Feedback siap. +${body.pointsAwarded} poin` : "Feedback siap",
      );
      if (body.lessonCompleted) toast.success("Materi ini selesai");
      router.refresh();
    } catch {
      toast.error("Jawaban belum bisa dinilai. Cek koneksimu lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs text-ink-2 tabular-nums">
        Studi kasus {number} · ({question.points} poin)
      </p>
      <div id={`${id}-prompt`} className="[&_p]:font-medium [&_p]:text-ink-strong">
        <LessonMarkdown>{question.promptMd}</LessonMarkdown>
      </div>
      {question.rubric.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-2 px-4 py-3 text-sm">
          <p className="font-medium text-ink-strong">Rubrik penilaian</p>
          <ul className="flex flex-col gap-1.5">
            {question.rubric.map((r) => (
              <li key={r.criterion} className="flex justify-between gap-3 text-ink-2">
                <span>
                  <span className="font-medium text-ink">{r.criterion}</span>: {r.description}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums">maks. {r.max_score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-answer`} className="text-sm font-medium text-ink-strong">
          Jawabanmu
        </label>
        <Textarea
          id={`${id}-answer`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={CASE_ANSWER_MAX}
          rows={7}
          disabled={pending || left <= 0}
          aria-describedby={`${id}-prompt ${id}-count`}
          placeholder="Tulis jawabanmu dengan kalimatmu sendiri."
        />
        <div
          id={`${id}-count`}
          className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3"
        >
          <span>
            {left > 0
              ? `Sisa ${left} dari ${MAX_CASE_ATTEMPTS} kali kirim`
              : `Kamu sudah memakai ${MAX_CASE_ATTEMPTS} kali kirim untuk soal ini.`}
          </span>
          <span className="font-mono tabular-nums">
            {answer.length.toLocaleString("id-ID")}/{CASE_ANSWER_MAX.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {left > 0 && (
        <Button
          variant="accent"
          onClick={send}
          disabled={pending || tooShort}
          aria-busy={pending}
          className="self-start"
          title={tooShort ? `Jawaban minimal ${CASE_ANSWER_MIN} karakter` : undefined}
          icon={<Sparkles aria-hidden size={16} strokeWidth={1.75} />}
        >
          {pending
            ? "Menilai jawaban…"
            : graded
              ? "Kirim ulang untuk dinilai"
              : "Kirim untuk dinilai"}
        </Button>
      )}

      {pending && <FeedbackSkeleton count={question.rubric.length} />}
      {!pending && graded && <FeedbackPanel graded={graded} />}
    </div>
  );
}

function FeedbackPanel({ graded: { attemptNo, feedback } }: { graded: Graded }) {
  const total = feedback.scores.reduce((sum, s) => sum + s.score, 0);
  const max = feedback.scores.reduce((sum, s) => sum + s.max_score, 0);
  return (
    <section
      role="status"
      aria-label="Feedback AI"
      className="flex flex-col gap-3 rounded-lg border border-line px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium text-ink-strong">
          Feedback percobaan {attemptNo}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Sparkles aria-hidden size={14} strokeWidth={1.75} />
            Dibuat AI
          </span>
        </p>
        <p className="font-mono text-sm text-ink-strong tabular-nums">
          {formatScore(total)}/{formatScore(max)}
        </p>
      </div>
      <p className="text-sm leading-6 text-ink-2">{feedback.overall}</p>
      <ul className="flex flex-col divide-y divide-line">
        {feedback.scores.map((s) => (
          <li key={s.criterion} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink-strong">{s.criterion}</p>
              <p
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  s.score >= s.max_score * 0.8 ? "text-success-ink" : "text-ink-2",
                )}
              >
                {formatScore(s.score)}/{formatScore(s.max_score)}
              </p>
            </div>
            {s.quote && (
              <blockquote className="border-l-2 border-line-strong pl-3 text-[13px] text-ink-3 italic">
                “{s.quote}”
              </blockquote>
            )}
            <p className="text-sm leading-6 text-ink-2">{s.comment}</p>
            <p className="text-sm leading-6 text-ink-2">
              <span className="font-medium text-ink">Saran: </span>
              {s.suggestion}
            </p>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-1.5 text-xs text-ink-3">
        <Info aria-hidden size={14} strokeWidth={1.75} />
        {AI_NOTE}
      </p>
    </section>
  );
}

function FeedbackSkeleton({ count }: { count: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Menilai jawaban"
      className="flex animate-pulse flex-col gap-3 rounded-lg border border-line px-4 py-3"
    >
      <div className="h-4 w-40 rounded-sm bg-surface-2" />
      <div className="h-3 w-full rounded-sm bg-surface-2" />
      {Array.from({ length: Math.max(count, 1) }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 w-1/3 rounded-sm bg-surface-2" />
          <div className="h-3 w-5/6 rounded-sm bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
