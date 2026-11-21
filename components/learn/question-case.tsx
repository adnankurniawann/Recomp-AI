import type { PlayerQuestion } from "@/lib/learn/queries";
import { LessonMarkdown } from "./lesson-markdown";

/**
 * A case-study question as the student reads it: the task and the short rubric. Sending an answer
 * and the AI feedback per criterion arrive with F-LRN-04 (#40), which replaces the note below.
 */
export function QuestionCase({ question, number }: { question: PlayerQuestion; number: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs text-ink-2 tabular-nums">
        Studi kasus {number} · ({question.points} poin)
      </p>
      <div className="[&_p]:font-medium [&_p]:text-ink-strong">
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
      <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-sm text-ink-2">
        Pengiriman jawaban studi kasus dan feedback AI segera dibuka.
      </p>
    </div>
  );
}
