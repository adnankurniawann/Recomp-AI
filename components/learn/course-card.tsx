import { BarChart3, Clock, ListChecks } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/format/duration";
import type { CourseCard as CourseCardData } from "@/lib/learn/catalog";
import { CourseCover } from "./course-cover";
import { CoursePrice } from "./course-price";

/** A course in the `/belajar` grid (PRD F-LRN-01). The whole card links to the course page. */
export function CourseCard({ course }: { course: CourseCardData }) {
  const started = (course.doneCount ?? 0) > 0;
  return (
    <Card
      interactive
      className="relative flex w-full flex-col gap-3 focus-within:ring-3 focus-within:ring-primary-200"
    >
      <CourseCover src={course.coverUrl} className="aspect-video" />

      <div className="flex flex-col gap-1">
        <Chip className="self-start">{COMP_CATEGORY_LABELS[course.category]}</Chip>
        <h2 className="mt-1 font-semibold text-ink-strong">
          <Link
            href={`/belajar/${course.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {course.title}
          </Link>
        </h2>
        {course.subtitle && <p className="text-sm text-ink-3">{course.subtitle}</p>}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-2">
        <li className="flex items-center gap-1.5">
          <ListChecks aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          <span className="font-mono tabular-nums">{course.lessonCount}</span> materi
        </li>
        <li className="flex items-center gap-1.5">
          <Clock aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          {formatDuration(course.estMinutes)}
        </li>
        <li className="flex items-center gap-1.5">
          <BarChart3 aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          {course.level}
        </li>
      </ul>

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3">
        {started && (
          <ProgressBar
            value={course.doneCount ?? 0}
            max={course.lessonCount}
            label={`${course.doneCount}/${course.lessonCount} materi selesai`}
          />
        )}
        <CoursePrice price={course.price} />
      </div>
    </Card>
  );
}
