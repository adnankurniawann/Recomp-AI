import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MentorForm } from "@/components/admin/mentor-form";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata: Metadata = { title: "Tambah mentor" };

export default function NewMentorPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/admin/mentor"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Semua mentor
      </Link>
      <header className="flex flex-col gap-1">
        <SectionLabel>Admin</SectionLabel>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Tambah mentor</h1>
      </header>
      <MentorForm />
    </main>
  );
}
