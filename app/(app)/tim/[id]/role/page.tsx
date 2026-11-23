import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditRolesForm } from "@/components/team/edit-roles-form";
import type { EditorRole } from "@/components/team/role-editor";
import { getRoleTemplates } from "@/lib/ai/role-suggestions";
import { isRoleKey } from "@/lib/constants";
import { loadSkillCatalog } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit role · Recomp AI" };

type Props = { params: Promise<{ id: string }> };

/** `/tim/[id]/role`: "Edit role" on the team dashboard, leader only (PRD F-TEM-02). */
export default async function EditRolesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: me }, { data: team }] = await Promise.all([
    supabase.rpc("current_profile_id"),
    supabase
      .from("teams")
      .select(
        "id, name, leader_id, competitions(category, team_max), team_roles(*, team_members(count))",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!me) redirect(`/masuk?next=${encodeURIComponent(`/tim/${id}/role`)}`);
  if (!team?.competitions) notFound();
  if (team.leader_id !== me) redirect(`/tim/${id}`);

  const [templates, catalog] = await Promise.all([
    getRoleTemplates(supabase, team.competitions.category),
    loadSkillCatalog(),
  ]);

  const roles: EditorRole[] = team.team_roles
    .sort((a, b) => a.sort - b.sort)
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      colorKey: isRoleKey(r.color_key) ? r.color_key : "other",
      source: r.source,
      sourcePage: r.source_page,
      sourceCriterion: r.source_criterion,
      edited: r.edited,
      requiredSkills: (r.required_skills as { skill_id: number; min_level: number }[]).map((s) => ({
        skillId: s.skill_id,
        minLevel: s.min_level,
      })),
      optionalSkillIds: r.optional_skill_ids,
      hoursPerWeek: r.hours_per_week,
      slots: r.slots,
      memberCount: r.team_members[0]?.count ?? 0,
    }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">Edit role</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong">
          Role {team.name}
        </h1>
        <p className="text-lg leading-relaxed text-ink-2">
          Atur role yang dibutuhkan tim. Kandidat di ranking ikut berubah setelah kamu simpan.
        </p>
      </header>
      <EditRolesForm
        teamId={team.id}
        initialRoles={roles}
        templates={templates}
        skills={catalog.skills}
        category={team.competitions.category}
        teamMax={team.competitions.team_max}
      />
    </main>
  );
}
