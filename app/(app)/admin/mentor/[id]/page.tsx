import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MentorForm } from "@/components/admin/mentor-form";
import { SectionLabel } from "@/components/ui/section-label";
import type { CompCategory, PreferredRoleKey } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit mentor" };

type Props = { params: Promise<{ id: string }> };

/** Edit a mentor, their services, and whether they show on /mentor (F-ADM-01). */
export default async function EditMentorPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("mentors")
    .select(
      "id, display_name, roles, headline, bio, competition_categories, verified, is_simulated, is_active, mentor_services(id, name, description, duration_min, price)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

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
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
          {m.display_name}
        </h1>
      </header>
      <MentorForm
        initial={{
          id: m.id,
          displayName: m.display_name,
          roles: m.roles as PreferredRoleKey[],
          headline: m.headline,
          bio: m.bio ?? "",
          categories: m.competition_categories as CompCategory[],
          verified: m.verified,
          isSimulated: m.is_simulated,
          isActive: m.is_active,
          services: [...m.mentor_services]
            .sort((a, b) => a.price - b.price)
            .map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description ?? "",
              durationMin: s.duration_min,
              price: s.price,
            })),
        }}
      />
    </main>
  );
}
