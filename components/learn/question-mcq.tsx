"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitMcq } from "@/app/(app)/belajar/actions";
import { Button } from "@/components/ui/button";
import { optionState, type OptionState } from "@/lib/learn/mcq";
import type { PlayerQuestion } from "@/lib/learn/queries";
import { cn } from "@/lib/utils";
import { LessonMarkdown } from "./lesson-markdown";

const OPTION: Record<OptionState, string> = {
  idle: "border-line bg-surface hover:border-primary-200",
  selected: "border-primary bg-surface",
  correct: "border-success bg-success-50",
  wrong: "border-danger bg-danger-50",
  muted: "border-line bg-surface opacity-70",
};

const LETTER: Record<OptionState, string> = {
  idle: "border-line bg-surface-2 text-ink-2",
  selected: "border-primary bg-primary text-white",
  correct: "border-success bg-success text-white",
  wrong: "border-danger bg-danger-50 text-danger-ink",
  muted: "border-line bg-surface-2 text-ink-2",
};

/**
 * One multiple-choice question (PRD F-LRN-03, §10.7): option cards with a letter box; "Kirim
 * jawaban" appears once one is picked. The answer is sent once; then the right option turns green,
 * a wrong pick red, and the explanation shows.
 */
export function QuestionMCQ({ question, number }: { question: PlayerQuestion; number: number }) {
  const router = useRouter();
  const name = useId();
  const [picked, setPicked] = useState<string | null>(question.attempt?.choice ?? null);
  const [result, setResult] = useState<{
    answered: string;
    answerKey: string | null;
    explanation: string | null;
    isCorrect: boolean | null;
    points: number;
  } | null>(
    question.attempt
      ? {
          answered: question.attempt.choice ?? "",
          answerKey: question.answerKey,
          explanation: question.explanationMd,
          isCorrect: question.attempt.isCorrect,
          points: question.attempt.pointsAwarded,
        }
      : null,
  );
  const [pending, startTransition] = useTransition();
  const locked = result !== null || pending;

  function send() {
    if (!picked) return;
    startTransition(async () => {
      const r = await submitMcq(question.id, picked);
      if (!r.ok) {
        toast.error(r.error.message);
        if (r.error.code === "ALREADY_ANSWERED") router.refresh();
        return;
      }
      setResult({
        answered: picked,
        answerKey: r.data.answerKey,
        explanation: r.data.explanation,
        isCorrect: r.data.isCorrect,
        points: r.data.points,
      });
      if (r.data.isCorrect) toast.success(`Benar! +${r.data.points} poin`);
      else toast("Belum tepat. Baca penjelasannya ya.");
      if (r.data.lessonCompleted) toast.success("Materi ini selesai");
      // Progress, points and the lesson list come from the server.
      router.refresh();
    });
  }

  const state = {
    picked,
    answered: result?.answered ?? null,
    answerKey: result?.answerKey ?? null,
  };

  return (
    <fieldset className="flex flex-col gap-3" disabled={locked} aria-describedby={`${name}-prompt`}>
      <legend className="font-mono text-xs text-ink-2 tabular-nums">
        Soal {number} · ({question.points} poin)
      </legend>
      <div id={`${name}-prompt`} className="[&_p]:font-medium [&_p]:text-ink-strong">
        <LessonMarkdown>{question.promptMd}</LessonMarkdown>
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((o) => {
          const s = optionState(o.key, state);
          return (
            <label
              key={o.key}
              className={cn(
                "relative flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-[border-color,background-color] duration-150 ease-out has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary-200",
                OPTION[s],
                locked && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.key}
                checked={picked === o.key}
                onChange={() => setPicked(o.key)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[13px] font-medium",
                  LETTER[s],
                )}
              >
                {o.key}
              </span>
              <span className="flex-1 pt-0.5 text-sm text-ink">{o.text}</span>
              {s === "correct" && (
                <CircleCheck
                  aria-label="Jawaban benar"
                  size={20}
                  strokeWidth={2}
                  className="shrink-0 text-success-ink"
                />
              )}
              {s === "wrong" && (
                <CircleX
                  aria-label="Jawabanmu salah"
                  size={20}
                  strokeWidth={2}
                  className="shrink-0 text-danger-ink"
                />
              )}
            </label>
          );
        })}
      </div>

      {result ? (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-1 rounded-lg px-4 py-3 text-sm",
            result.isCorrect ? "bg-success-50" : "bg-surface-2",
          )}
        >
          <p
            className={cn("font-medium", result.isCorrect ? "text-success-ink" : "text-ink-strong")}
          >
            {result.isCorrect
              ? `Benar, kamu dapat ${result.points} poin.`
              : `Belum tepat. Jawaban yang benar: ${result.answerKey ?? "-"}.`}
          </p>
          {result.explanation && (
            <div className="text-ink-2 [&_p]:text-sm [&_p]:leading-6 [&_p]:text-ink-2">
              <LessonMarkdown>{result.explanation}</LessonMarkdown>
            </div>
          )}
        </div>
      ) : (
        picked && (
          <Button
            variant="accent"
            onClick={send}
            disabled={pending}
            aria-busy={pending}
            className="self-start"
          >
            {pending ? "Mengirim…" : "Kirim jawaban"}
          </Button>
        )
      )}
    </fieldset>
  );
}
