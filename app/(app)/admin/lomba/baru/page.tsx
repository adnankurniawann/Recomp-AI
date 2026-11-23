import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompetitionForm } from "@/components/admin/competition-form";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata: Metadata = { title: "Tambah lomba" };

export default function NewCompetitionPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/admin/lomba"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Semua lomba
      </Link>
      <header className="flex flex-col gap-1">
        <SectionLabel>Admin</SectionLabel>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Tambah lomba</h1>
        <p className="text-ink-2">Guidebook bisa diunggah setelah lomba tersimpan.</p>
      </header>
      <CompetitionForm />
    </main>
  );
}
