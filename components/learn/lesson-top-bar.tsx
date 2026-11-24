"use client";

import {
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDot,
  CircleHelp,
  Lock,
  Menu,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { LessonStatus, Outline } from "@/lib/learn/outline";
import { cn } from "@/lib/utils";
import { useDismiss } from "./use-dismiss";

const STATUS: Record<LessonStatus, { icon: LucideIcon; label: string; className: string }> = {
  done: { icon: CircleCheck, label: "Selesai", className: "text-success-ink" },
  current: { icon: CircleDot, label: "Sedang dibuka", className: "text-primary" },
  open: { icon: Circle, label: "Belum dimulai", className: "text-ink-3" },
  locked: { icon: Lock, label: "Terkunci", className: "text-ink-3" },
};

function Popover({
  label,
  trigger,
  children,
  align = "left",
  className,
}: {
  label: string;
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, button);

  return (
    <div ref={root} className="relative">
      {trigger({
        ref: button,
        onClick: () => setOpen((o) => !o),
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && (
        <div
          id={id}
          role="region"
          aria-label={label}
          className={cn(
            "fixed inset-x-4 top-[68px] z-40 max-h-[calc(100dvh-140px)] overflow-y-auto rounded-xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-[calc(100%+8px)]",
            align === "right" ? "sm:right-0" : "sm:left-0",
            className,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

interface LessonTopBarProps {
  course: { slug: string; title: string };
  chapterTitle: string;
  lessonTitle: string;
  outline: Outline;
  answered: number;
  totalQuestions: number;
  points: number;
}

/**
 * The 64 px player bar (PRD §10.7): small logo, a breadcrumb pill that opens the lesson list, the
 * "3/27 latihan selesai" bar, the points chip, "Panduan" and the menu.
 */
export function LessonTopBar({
  course,
  chapterTitle,
  lessonTitle,
  outline,
  answered,
  totalQuestions,
  points,
}: LessonTopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <Logo size="sm" className="hidden shrink-0 md:inline-flex" />

      <Popover
        label="Daftar materi"
        className="sm:w-[380px]"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className="flex h-11 min-w-0 items-center gap-1.5 rounded-full bg-wash px-3 text-sm font-medium text-primary-hover transition-colors duration-150 ease-out hover:bg-primary-200 focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-10"
          >
            <span className="hidden truncate xl:inline">{course.title} ›</span>
            <span className="hidden truncate xl:inline">{chapterTitle} ›</span>
            <span className="max-w-[40vw] truncate sm:max-w-[220px]">{lessonTitle}</span>
            <ChevronDown aria-hidden size={16} strokeWidth={1.75} className="shrink-0" />
          </button>
        )}
      >
        {(close) => (
          <nav aria-label="Daftar materi" className="flex flex-col py-2">
            <Link
              href={`/belajar/${course.slug}`}
              onClick={close}
              className="px-4 pt-1 pb-2 text-sm font-semibold text-ink-strong hover:text-primary"
            >
              {course.title}
            </Link>
            {outline.chapters.map((chapter, i) => (
              <div key={chapter.id} className="flex flex-col">
                <p className="px-4 pt-2 pb-1 font-mono text-[11px] tracking-[0.14em] text-ink-2 uppercase">
                  Bab {i + 1} · {chapter.title}
                </p>
                <ul className="flex flex-col">
                  {chapter.lessons.map((l) => {
                    const s = STATUS[l.status];
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/belajar/${course.slug}/${l.slug}`}
                          onClick={close}
                          aria-current={l.status === "current" ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center gap-2.5 px-4 py-2 text-sm hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                            l.status === "current" ? "font-medium text-ink-strong" : "text-ink-2",
                          )}
                        >
                          <s.icon
                            aria-hidden
                            size={16}
                            strokeWidth={1.75}
                            className={cn("shrink-0", s.className)}
                          />
                          <span className="sr-only">{s.label}:</span>
                          {l.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        )}
      </Popover>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden w-44 flex-col gap-1 md:flex">
          <ProgressBar
            value={answered}
            max={totalQuestions}
            label={`Progres latihan: ${answered} dari ${totalQuestions}`}
            className="[&>span]:sr-only"
          />
          <span aria-hidden className="text-xs text-ink-2">
            <span className="font-mono tabular-nums">
              {answered}/{totalQuestions}
            </span>{" "}
            latihan selesai
          </span>
        </div>

        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-[13px] font-medium text-ink">
          <Star aria-hidden size={14} strokeWidth={1.75} className="text-warning-ink" />
          <span className="font-mono tabular-nums">{points}</span> poin
        </span>

        <Popover
          label="Panduan"
          align="right"
          className="sm:w-[320px]"
          trigger={(props) => (
            <button
              type="button"
              {...props}
              className="hidden h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none sm:inline-flex"
            >
              <CircleHelp aria-hidden size={16} strokeWidth={1.75} />
              Panduan
            </button>
          )}
        >
          {() => <GuideText />}
        </Popover>

        <Popover
          label="Menu"
          align="right"
          className="sm:w-[240px]"
          trigger={(props) => (
            <IconButton
              {...props}
              label="Menu"
              icon={<Menu aria-hidden size={18} strokeWidth={1.75} />}
              className="size-11 sm:size-10"
            />
          )}
        >
          {(close) => (
            <nav aria-label="Menu" className="flex flex-col py-1 text-sm">
              {[
                { href: `/belajar/${course.slug}`, label: "Halaman kursus" },
                { href: "/belajar", label: "Semua kursus" },
                { href: "/mentor", label: "Tanya mentor" },
                { href: "/lomba", label: "Kembali ke lomba" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex min-h-11 items-center px-4 text-ink hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-line sm:hidden">
                <GuideText />
              </div>
            </nav>
          )}
        </Popover>
      </div>
    </header>
  );
}

function GuideText() {
  return (
    <div className="flex flex-col gap-2 p-4 text-sm text-ink-2">
      <p className="font-semibold text-ink-strong">Cara belajar di sini</p>
      <ul className="flex list-disc flex-col gap-1.5 pl-4">
        <li>Baca materi di kiri, lalu jawab soal di kanan.</li>
        <li>Setiap soal hanya bisa dikirim sekali. Jawaban benar menambah poin.</li>
        <li>
          Materi selesai setelah semua soalnya dijawab, atau dibaca sampai bawah kalau tidak ada
          soal.
        </li>
        <li>Pindah materi lewat bar biru di bawah atau daftar materi di atas.</li>
      </ul>
    </div>
  );
}
