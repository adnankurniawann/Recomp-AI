import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompetitionForm } from "@/components/admin/competition-form";
import { GuidebookPanel } from "@/components/admin/guidebook-panel";
import { SectionLabel } from "@/components/ui/section-label";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

export const metadata: Metadata = { title: "Edit lomba" };

type Props = { params: Promise<{ id: string }> };

/** Edit a competition, upload its guidebook and run or review the extraction (F-CMP-04). */
export default async function EditCompetitionPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("competitions")
    .select("*, competition_extractions(id, status, created_at, error, data)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const extractions = [...c.competition_extractions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)
    .map((x) => ({
      id: x.id,
      status: x.status,
      createdAt: x.created_at,
      error: x.error,
      current:
        (x.data as { guidebook_path?: string } | null)?.guidebook_path === c.guidebook_path ||
        x.status === "failed",
    }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/admin/lomba"
        className="tap-target inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Semua lomba
      </Link>
      <header className="flex flex-col gap-1">
        <SectionLabel>Admin</SectionLabel>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">{c.name}</h1>
        <Link
          href={`/lomba/${c.slug}`}
          className="tap-target self-start text-sm text-primary hover:underline"
        >
          Lihat halaman lomba
        </Link>
      </header>
      <GuidebookPanel
        competitionId={c.id}
        guidebook={
          c.guidebook_path
            ? { path: c.guidebook_path, url: publicStorageUrl("guidebooks", c.guidebook_path) }
            : null
        }
        extractions={extractions}
      />
      <CompetitionForm
        initial={{
          id: c.id,
          slug: c.slug,
          name: c.name,
          organizer: c.organizer,
          category: c.category,
          description: c.description ?? "",
          registrationDeadline: c.registration_deadline ?? "",
          eventDate: c.event_date ?? "",
          teamMin: c.team_min,
          teamMax: c.team_max,
          officialUrl: c.official_url ?? "",
          isPublished: c.is_published,
          isFeatured: c.is_featured,
          isSimulated: c.is_simulated,
        }}
      />
    </main>
  );
}
