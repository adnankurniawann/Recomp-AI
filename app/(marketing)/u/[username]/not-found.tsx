import { UserX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PublicProfileNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <EmptyState
        icon={UserX}
        title="Profil tidak ditemukan"
        body="Username ini belum terdaftar, atau pemiliknya belum menyelesaikan profil."
        action={
          <Link href="/lomba" className={buttonClasses("secondary")}>
            Lihat daftar lomba
          </Link>
        }
      />
    </main>
  );
}
