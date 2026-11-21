import { ChevronDown, CircleCheck, CircleDot, Circle, Lock } from "lucide-react";
import Link from "next/link";
import type { LessonStatus, Outline } from "@/lib/learn/outline";
import { formatDuration } from "@/lib/format/duration";
import { cn } from "@/lib/utils";

const STATUS: Record<LessonStatus, { icon: typeof Circle; label: string; className: string }> = {
  done: { icon: CircleCheck, label: "Selesai", className: "text-success-ink" },
  current: { icon: CircleDot, label: "Sedang dipelajari", className: "text-primary" },
  open: { icon: Circle, label: "Belum dimulai", className: "text-ink-3" },
  locked: { icon: Lock, label: "Terkunci", className: "text-ink-3" },
};

/**
 * The chapters of a course as an accordion (PRD F-LRN-02): native `<details>`, open by default,
 * each lesson with its status icon. Locked lessons still link, so the player can show how to open them.
 */
export function ChapterList({
  courseSlug,
  outline,
  lessonMinutes,
}: {
  courseSlug: string;
  outline: Outline;
  lessonMinutes: Record<string, number | null>;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {outline.chapters.map((chapter, i) => {
        const done = chapter.lessons.filter((l) => l.status === "done").length;
        return (
          <li key={chapter.id}>
            <details open className="group rounded-xl border border-line bg-surface shadow-xs">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs text-ink-3 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium text-ink-strong">{chapter.title}</span>
                  <span className="text-xs text-ink-3">
                    <span className="font-mono tabular-nums">
                      {done}/{chapter.lessons.length}
                    </span>{" "}
                    materi selesai
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 text-ink-3 transition-transform duration-150 ease-out group-open:rotate-180"
                />
              </summary>
              <ul className="flex flex-col border-t border-line py-1">
                {chapter.lessons.map((lesson) => {
                  const s = STATUS[lesson.status];
                  const minutes = lessonMinutes[lesson.id];
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/belajar/${courseSlug}/${lesson.slug}`}
                        className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                      >
                        <s.icon
                          aria-hidden
                          size={18}
                          strokeWidth={1.75}
                          className={cn("shrink-0", s.className)}
                        />
                        <span className="sr-only">{s.label}:</span>
                        <span
                          className={cn(
                            "min-w-0 flex-1",
                            lesson.status === "locked" ? "text-ink-2" : "text-ink",
                            lesson.status === "current" && "font-medium text-ink-strong",
                          )}
                        >
                          {lesson.title}
                        </span>
                        {minutes ? (
                          <span className="shrink-0 text-xs text-ink-3">
                            {formatDuration(minutes)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
