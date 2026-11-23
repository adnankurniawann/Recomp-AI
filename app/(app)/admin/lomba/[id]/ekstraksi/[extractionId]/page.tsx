import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExtractionReviewForm } from "@/components/admin/extraction-review-form";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { EXTRACTION_STATUS } from "@/lib/ai/extraction-status";
import { getRoleTemplates } from "@/lib/ai/role-suggestions";
import type { StoredExtraction } from "@/lib/ai/skill-map";
import { loadSkillCatalog } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review ekstraksi" };

type Props = { params: Promise<{ id: string; extractionId: string }> };

/** Review the guidebook agent's result as a form and approve it (F-CMP-04). */
export default async function ReviewExtractionPage({ params }: Props) {
  const { id, extractionId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(extractionId)) notFound();
  const supabase = await createClient();
  const { data: x } = await supabase
    .from("competition_extractions")
    .select("id, status, data, warnings, page_count, competition:competitions(id, name, category)")
    .eq("id", extractionId)
    .eq("competition_id", id)
    .maybeSingle();
  if (!x?.competition || !x.data || (x.status !== "draft" && x.status !== "reviewed")) notFound();

  const d = x.data as unknown as StoredExtraction;
  const [templates, catalog] = await Promise.all([
    getRoleTemplates(supabase, x.competition.category),
    loadSkillCatalog(),
  ]);
  const status = EXTRACTION_STATUS[x.status];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/admin/lomba/${id}`}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        {x.competition.name}
      </Link>
      <header className="flex flex-col gap-2">
        <SectionLabel>Review ekstraksi</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
            Hasil baca guidebook
          </h1>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>
        <p className="text-ink-2">
          Periksa dan perbaiki hasil AI. Setelah disetujui, ringkasan dan role ini dipakai di
          halaman lomba dan saat ketua membuat tim.
        </p>
      </header>

      {x.warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-ink">
          <TriangleAlert aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <ul className="flex flex-col gap-1">
            {x.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <ExtractionReviewForm
        extractionId={x.id}
        competitionId={id}
        category={x.competition.category}
        skills={catalog.skills}
        templates={templates}
        initial={{
          summary: d.summary,
          teamSize: { min: d.team_size.min, max: d.team_size.max },
          deadlines: d.deadlines.map((dl) => ({ name: dl.name, date: dl.date, page: dl.page })),
          criteria: d.judging_criteria.map((c) => ({
            name: c.name,
            weightPercent: c.weight_percent,
            ...(c.description && { description: c.description }),
            page: c.page,
          })),
          roles: d.roles.map((r) => ({ ...r, edited: false })),
        }}
      />
    </main>
  );
}
