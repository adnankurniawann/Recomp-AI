import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  MessageCircle,
  NotebookPen,
  Star,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import type { OutlineLesson } from "@/lib/learn/outline";
import { cn } from "@/lib/utils";

// The cards and bars of the lesson player (PRD §10.7). Server-rendered; the parts that act live in
// QuestionMCQ, ReadToEnd and LessonTopBar.

function PanelCard({
  icon,
  iconClassName,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface shadow-xs",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-3">
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h2 className="font-semibold text-ink-strong">{title}</h2>
      </header>
      {children}
    </section>
  );
}

/** "Catatan": the rules of the player and "Tanya Mentor". */
export function NotesCard() {
  return (
    <PanelCard
      title="Catatan"
      iconClassName="bg-warning-50 text-warning-ink"
      icon={<NotebookPen aria-hidden size={16} strokeWidth={1.75} />}
    >
      <div className="flex flex-col gap-4 p-4">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-2">
          <li>Periksa jawaban sebelum dikirim.</li>
          <li>Jawaban hanya bisa dikirim sekali.</li>
          <li>Jawaban benar menambah poin dan progresmu.</li>
        </ul>
        <Link href="/mentor" className={buttonClasses("secondary", "lg", "w-full")}>
          <MessageCircle aria-hidden size={16} strokeWidth={1.75} />
          Tanya Mentor
        </Link>
      </div>
    </PanelCard>
  );
}

/** "Materi": the lesson content. */
export function ContentCard({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Materi"
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-6"
    >
      {children}
    </section>
  );
}

/** "Pertanyaan" with the "Kamu mendapatkan" banner above the questions. */
export function QuestionsCard({
  earned,
  total,
  children,
}: {
  earned: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <PanelCard
      title="Pertanyaan"
      iconClassName="bg-role-uiux-soft text-role-uiux-ink"
      icon={<CircleHelp aria-hidden size={16} strokeWidth={1.75} />}
    >
      {total > 0 && (
        <p className="flex items-center gap-1.5 border-b border-line bg-wash px-4 py-2 text-sm text-ink-2">
          Kamu mendapatkan:
          <Star aria-hidden size={14} strokeWidth={1.75} className="text-warning-ink" />
          <span className="font-mono font-medium text-ink-strong tabular-nums">{earned}</span>
          dari <span className="font-mono tabular-nums">{total}</span> poin
        </p>
      )}
      <div className="flex flex-col divide-y divide-line">{children}</div>
    </PanelCard>
  );
}

/** The 56 px primary bar: previous lesson on the left, next on the right, titles cut with an ellipsis. */
export function LessonBottomBar({
  courseSlug,
  previous,
  next,
}: {
  courseSlug: string;
  previous: OutlineLesson | null;
  next: OutlineLesson | null;
}) {
  const link =
    "flex h-11 min-w-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-white hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none";
  return (
    <nav
      aria-label="Materi sebelum dan sesudah"
      className="flex h-14 shrink-0 items-center justify-between gap-3 bg-primary px-2 sm:px-4"
    >
      {previous ? (
        <Link href={`/belajar/${courseSlug}/${previous.slug}`} className={cn(link, "max-w-[48%]")}>
          <ChevronLeft aria-hidden size={18} strokeWidth={2} className="shrink-0" />
          <span className="sr-only">Sebelumnya: </span>
          <span className="truncate">{previous.title}</span>
        </Link>
      ) : (
        <Link href={`/belajar/${courseSlug}`} className={cn(link, "max-w-[48%]")}>
          <ChevronLeft aria-hidden size={18} strokeWidth={2} className="shrink-0" />
          <span className="truncate">Halaman kursus</span>
        </Link>
      )}
      {next ? (
        <Link
          href={`/belajar/${courseSlug}/${next.slug}`}
          className={cn(link, "ml-auto max-w-[48%] justify-end")}
        >
          <span className="sr-only">Berikutnya: </span>
          <span className="truncate">{next.title}</span>
          <ChevronRight aria-hidden size={18} strokeWidth={2} className="shrink-0" />
        </Link>
      ) : (
        <Link
          href={`/belajar/${courseSlug}`}
          className={cn(link, "ml-auto max-w-[48%] justify-end")}
        >
          <span className="truncate">Selesai, kembali ke kursus</span>
          <ChevronRight aria-hidden size={18} strokeWidth={2} className="shrink-0" />
        </Link>
      )}
    </nav>
  );
}
