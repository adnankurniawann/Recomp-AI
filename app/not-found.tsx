import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Any address that doesn't exist (Next's default 404 is in English). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-12">
      <EmptyState
        icon={SearchX}
        title="Halaman tidak ditemukan"
        body="Mungkin tautannya salah atau halamannya sudah dipindah."
        action={
          <Link href="/" className={buttonClasses("secondary")}>
            Ke beranda
          </Link>
        }
      />
    </main>
  );
}
