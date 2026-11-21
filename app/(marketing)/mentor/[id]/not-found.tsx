import { UserX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function MentorNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <EmptyState
        icon={UserX}
        title="Mentor tidak ditemukan"
        body="Mentor ini tidak ada atau sedang tidak aktif."
        action={
          <Link href="/mentor" className={buttonClasses("secondary")}>
            Lihat semua mentor
          </Link>
        }
      />
    </main>
  );
}
