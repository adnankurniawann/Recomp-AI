import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { CourseCard } from "@/components/learn/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { loadCourseCatalog } from "@/lib/learn/catalog";

export const metadata: Metadata = { title: "Belajar" };

/** Course catalog (PRD F-LRN-01, §10.11). Public; signed-in students also see their progress. */
export default async function CoursesPage() {
  const courses = await loadCourseCatalog();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-1">
        <SectionLabel>Belajar</SectionLabel>
        <h1 className="text-2xl font-semibold text-ink-strong">Siapkan timmu sebelum hari lomba</h1>
        <p className="max-w-2xl text-ink-2">
          Kursus singkat yang ditulis tim Recomp AI: baca materi, jawab soal, kumpulkan poin.
        </p>
      </header>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada kursus yang dibuka"
          body="Kursus pertama sedang disiapkan. Cek lagi nanti ya."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c.id} className="flex">
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
