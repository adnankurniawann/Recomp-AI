import { ArrowLeft, BarChart3, Check, Clock, ListChecks, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterList } from "@/components/learn/chapter-list";
import { CourseCover } from "@/components/learn/course-cover";
import { CoursePrice } from "@/components/learn/course-price";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionLabel } from "@/components/ui/section-label";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/format/duration";
import { loadCourseDetail } from "@/lib/learn/catalog";

type Props = { params: Promise<{ kursus: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await loadCourseDetail((await params).kursus);
  return { title: course?.title ?? "Kursus tidak ditemukan" };
}

/** Course page (PRD F-LRN-02, §10.11): hero, what you learn, chapters, "Mulai belajar". */
export default async function CoursePage({ params }: Props) {
  const course = await loadCourseDetail((await params).kursus);
  if (!course) notFound();

  const started = course.doneCount > 0;
  const startHref = course.resume ? `/belajar/${course.slug}/${course.resume.slug}` : null;
  const learn = course.outline.lessons.slice(0, 8);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/belajar"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-ink-2 hover:text-ink-strong sm:min-h-0"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Kembali ke daftar kursus
      </Link>

      <section className="flex flex-col gap-6 md:flex-row md:items-start">
        <CourseCover
          src={course.coverUrl}
          iconSize={40}
          className="aspect-video w-full shrink-0 rounded-xl border border-line md:w-[340px]"
        />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Chip className="self-start">{COMP_CATEGORY_LABELS[course.category]}</Chip>
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink-strong">
              {course.title}
            </h1>
            {course.subtitle && <p className="text-ink-2">{course.subtitle}</p>}
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
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
            {course.signedIn && course.points > 0 && (
              <li className="flex items-center gap-1.5">
                <Star aria-hidden size={16} strokeWidth={1.75} className="text-warning-ink" />
                <span className="font-mono tabular-nums">{course.points}</span> poin
              </li>
            )}
          </ul>

          <CoursePrice price={course.price} hasAccess={course.hasAccess} />

          {started && (
            <ProgressBar
              value={course.doneCount}
              max={course.lessonCount}
              label={`${course.doneCount}/${course.lessonCount} materi selesai`}
              className="max-w-sm"
            />
          )}

          {startHref && (
            <Link href={startHref} className={buttonClasses("primary", "lg", "self-start")}>
              {started ? "Lanjutkan" : "Mulai belajar"}
            </Link>
          )}
          {!course.signedIn && (
            <p className="text-sm text-ink-3">Masuk dulu untuk menyimpan progres dan poinmu.</p>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-3" aria-labelledby="bab-heading">
          <SectionLabel>Isi kursus</SectionLabel>
          <h2 id="bab-heading" className="text-xl font-semibold text-ink-strong">
            Bab dan materi
          </h2>
          <ChapterList
            courseSlug={course.slug}
            outline={course.outline}
            lessonMinutes={course.lessonMinutes}
          />
        </section>

        <aside className="flex flex-col gap-4">
          {course.description && (
            <Card padding="lg" className="flex flex-col gap-2">
              <h2 className="font-semibold text-ink-strong">Tentang kursus</h2>
              <p className="text-sm text-ink-2">{course.description}</p>
            </Card>
          )}
          {learn.length > 0 && (
            <Card padding="lg" className="flex flex-col gap-3">
              <h2 className="font-semibold text-ink-strong">Yang akan kamu pelajari</h2>
              <ul className="flex flex-col gap-2 text-sm text-ink-2">
                {learn.map((l) => (
                  <li key={l.id} className="flex gap-2">
                    <Check
                      aria-hidden
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-success-ink"
                    />
                    {l.title}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}
