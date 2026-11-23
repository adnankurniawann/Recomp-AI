import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreateTeamWizard } from "@/components/team/create-team-wizard";
import { getRoleSuggestions, getRoleTemplates } from "@/lib/ai/role-suggestions";
import { loadCompetition } from "@/lib/competitions/queries";
import { loadSkillCatalog } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buat tim · Recomp AI" };

type Props = { searchParams: Promise<{ lomba?: string }> };

/** `/tim/baru?lomba=[slug]`: the three-step team wizard (PRD F-TEM-01, §10.11). */
export default async function NewTeamPage({ searchParams }: Props) {
  const slug = (await searchParams).lomba;
  if (!slug) redirect("/lomba");

  const c = await loadCompetition(slug);
  if (!c) notFound();
  if (!c.viewer) redirect(`/masuk?next=${encodeURIComponent(`/tim/baru?lomba=${slug}`)}`);
  if (c.viewer.teamId) redirect(`/tim/${c.viewer.teamId}`);

  const supabase = await createClient();
  const [suggestions, templates, catalog] = await Promise.all([
    getRoleSuggestions(supabase, c.id),
    getRoleTemplates(supabase, c.category),
    loadSkillCatalog(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">Buat tim</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong">
          Tim untuk {c.name}
        </h1>
        <p className="text-lg leading-relaxed text-ink-2">
          Tentukan tujuan tim, cek role yang dibutuhkan lomba ini, lalu pilih role kamu sebagai
          ketua.
        </p>
      </header>
      <CreateTeamWizard
        competition={{ id: c.id, category: c.category, teamMax: c.teamMax }}
        suggestions={suggestions}
        templates={templates}
        skills={catalog.skills}
      />
    </main>
  );
}
