import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CompetitionNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <EmptyState
        icon={SearchX}
        title="Lomba tidak ditemukan"
        body="Mungkin tautannya salah atau lombanya sudah ditarik."
        action={
          <Link href="/lomba" className={buttonClasses("secondary")}>
            Lihat semua lomba
          </Link>
        }
      />
    </main>
  );
}
