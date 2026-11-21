import { CircleCheck, ExternalLink, FileQuestion } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseUnlockCard } from "@/components/learn/course-unlock-card";
import {
  ContentCard,
  LessonBottomBar,
  NotesCard,
  QuestionsCard,
} from "@/components/learn/lesson-panels";
import { LessonMarkdown } from "@/components/learn/lesson-markdown";
import { LessonShell } from "@/components/learn/lesson-shell";
import { LessonTopBar } from "@/components/learn/lesson-top-bar";
import { QuestionCase } from "@/components/learn/question-case";
import { QuestionMCQ } from "@/components/learn/question-mcq";
import { ReadToEnd } from "@/components/learn/read-to-end";
import { lessonPoints } from "@/lib/learn/mcq";
import { loadLessonPlayer } from "@/lib/learn/queries";
import { videoEmbedUrl } from "@/lib/learn/video";

type Props = { params: Promise<{ kursus: string; materi: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kursus, materi } = await params;
  const data = await loadLessonPlayer(kursus, materi);
  return { title: data ? `${data.lesson.title} · ${data.course.title}` : "Materi tidak ditemukan" };
}

/** The lesson player (PRD F-LRN-03, §10.7). Signed-in only; the middleware sends others to /masuk. */
export default async function LessonPage({ params }: Props) {
  const { kursus, materi } = await params;
  const data = await loadLessonPlayer(kursus, materi);
  if (!data) notFound();

  const { course, lesson, outline, questions, progress } = data;
  const current = outline.lessons.find((l) => l.id === lesson.id);
  const points = lessonPoints(questions);
  const embed = videoEmbedUrl(lesson.videoUrl);

  // Keys on the shell's slots: a refresh sends them again from the server, and React's key check
  // otherwise flags the client top bar as an unkeyed child of LessonShell.
  const top = (
    <LessonTopBar
      key="top"
      course={course}
      chapterTitle={current?.chapterTitle ?? ""}
      lessonTitle={lesson.title}
      outline={outline}
      answered={progress.answered}
      totalQuestions={progress.totalQuestions}
      points={progress.points}
    />
  );
  const bottom = (
    <LessonBottomBar courseSlug={course.slug} previous={outline.previous} next={outline.next} />
  );

  if (!lesson.isOpen) {
    const locked = (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-strong">{lesson.title}</h1>
        <CourseUnlockCard courseId={course.id} courseTitle={course.title} price={course.price} />
      </div>
    );
    return <LessonShell top={top} left={locked} right={<NotesCard />} bottom={bottom} />;
  }

  const left = (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <NotesCard />
      <ContentCard>
        {lesson.contentMd ? (
          <LessonMarkdown>{lesson.contentMd}</LessonMarkdown>
        ) : (
          <h1 className="text-2xl font-semibold text-ink-strong">{lesson.title}</h1>
        )}
        {embed ? (
          <div className="aspect-video overflow-hidden rounded-lg border border-line bg-surface-2">
            <iframe
              src={embed}
              title={`Video: ${lesson.title}`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full"
            />
          </div>
        ) : (
          lesson.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:text-primary-hover"
            >
              Tonton videonya
              <ExternalLink aria-hidden size={14} strokeWidth={1.75} />
            </a>
          )
        )}
        {questions.length === 0 &&
          (lesson.isDone ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success-ink">
              <CircleCheck aria-hidden size={16} strokeWidth={1.75} />
              Materi ini sudah selesai
            </p>
          ) : (
            <ReadToEnd lessonId={lesson.id} />
          ))}
      </ContentCard>
    </div>
  );

  const right = (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <QuestionsCard earned={points.earned} total={points.total}>
        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-wash text-primary-hover">
              <FileQuestion aria-hidden size={18} strokeWidth={1.75} />
            </span>
            <p className="text-sm font-medium text-ink-strong">Materi ini tanpa soal</p>
            <p className="text-sm text-ink-3">Baca sampai bawah untuk menyelesaikannya.</p>
          </div>
        ) : (
          questions.map((q, i) => (
            <div key={q.id} className="p-4 sm:p-5">
              {q.type === "mcq" ? (
                <QuestionMCQ question={q} number={i + 1} />
              ) : (
                <QuestionCase question={q} number={i + 1} />
              )}
            </div>
          ))
        )}
      </QuestionsCard>
      {lesson.isDone && questions.length > 0 && (
        <p className="flex items-center gap-2 text-sm font-medium text-success-ink">
          <CircleCheck aria-hidden size={16} strokeWidth={1.75} />
          Semua soal sudah dijawab. Materi ini selesai.
        </p>
      )}
    </div>
  );

  return (
    <LessonShell
      top={top}
      left={left}
      right={right}
      bottom={bottom}
      questionCount={questions.length}
    />
  );
}
