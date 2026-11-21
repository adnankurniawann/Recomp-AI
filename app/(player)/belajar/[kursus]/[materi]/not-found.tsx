import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LessonNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4">
      <EmptyState
        icon={SearchX}
        title="Materi tidak ditemukan"
        body="Mungkin tautannya salah atau materinya sudah dipindah."
        action={
          <Link href="/belajar" className={buttonClasses("secondary")}>
            Lihat semua kursus
          </Link>
        }
      />
    </main>
  );
}
