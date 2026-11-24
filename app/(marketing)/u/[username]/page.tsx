import { FolderOpen, Pencil, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryTimeline } from "@/components/profile/history-timeline";
import { PortfolioGrid } from "@/components/profile/portfolio-grid";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { CandidateInvite } from "@/components/ranking/candidate-parts";
import { MatchPanel } from "@/components/ranking/match-panel";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillChip } from "@/components/ui/skill-chip";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { loadPublicProfile } from "@/lib/profile/public";
import { loadRoleMatch } from "@/lib/ranking/role-match";

// SectionLabel's look on a real heading, so the sections show up in the heading outline.
const SECTION_LABEL =
  "font-mono text-[11px] leading-[1.4] font-medium tracking-[0.18em] text-ink-3 uppercase";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ team?: string; role?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await loadPublicProfile((await params).username);
  return { title: profile ? profile.fullName : "Profil tidak ditemukan" };
}

/**
 * Public profile (PRD F-PRF-06, §10.6): no contacts, ever. Opened from the team page with
 * `?team=...&role=...`, members of that team also see the match panel for the role.
 */
export default async function PublicProfilePage({ params, searchParams }: Props) {
  const profile = await loadPublicProfile((await params).username);
  if (!profile) notFound();
  const { team, role } = await searchParams;
  const match = profile.isOwn ? null : await loadRoleMatch(team, role, profile.id);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[340px_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <Card padding="lg" className="flex flex-col gap-6">
          <ProfileSummary profile={profile} />
          {profile.isOwn && (
            <Link href="/profil" className={buttonClasses("secondary", "md", "self-start")}>
              <Pencil aria-hidden size={16} strokeWidth={1.75} />
              Edit profil
            </Link>
          )}
          <section className="flex flex-col gap-3" aria-labelledby="skills-label">
            <h2 id="skills-label" className={SECTION_LABEL}>
              Skill
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <li key={s.skillId}>
                  <SkillChip name={s.name} level={s.level} href={s.evidenceUrl} />
                </li>
              ))}
            </ul>
          </section>
        </Card>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        {match &&
          (match.candidate ? (
            <MatchPanel candidate={match.candidate} roleName={match.role.name} headingAs="h2">
              {match.invite && (
                <CandidateInvite
                  candidate={match.candidate}
                  role={match.role}
                  invite={match.invite}
                  className="self-start"
                />
              )}
            </MatchPanel>
          ) : (
            <p className="rounded-xl border border-line bg-surface-2/40 p-4 text-sm text-ink-2">
              {profile.fullName} tidak ada di daftar kandidat {match.role.name}. Bisa jadi sudah
              diundang, sudah punya tim di lomba ini, belum menandai lomba ini, atau belum punya
              skill wajib role ini.
            </p>
          ))}
        <section className="flex flex-col gap-3" aria-labelledby="history-label">
          <h2 id="history-label" className={SECTION_LABEL}>
            Riwayat lomba
          </h2>
          {profile.history.length > 0 ? (
            <Card padding="lg">
              <HistoryTimeline items={profile.history} />
            </Card>
          ) : (
            <EmptyState icon={Trophy} title="Belum ada riwayat lomba" />
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="portfolio-label">
          <h2 id="portfolio-label" className={SECTION_LABEL}>
            Portofolio
          </h2>
          {profile.portfolio.length > 0 ? (
            <PortfolioGrid items={profile.portfolio} columns={3} />
          ) : (
            <EmptyState icon={FolderOpen} title="Belum ada portofolio" />
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="interests-label">
          <h2 id="interests-label" className={SECTION_LABEL}>
            Lomba yang diminati
          </h2>
          {profile.interests.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.interests.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/lomba/${c.slug}`}
                    className="flex h-full flex-col gap-1 rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors duration-150 ease-out hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
                  >
                    <span className="font-medium text-ink-strong">{c.name}</span>
                    <span className="text-sm text-ink-2">
                      {COMP_CATEGORY_LABELS[c.category]}
                      {c.registrationDeadline && (
                        <>
                          {" "}
                          · deadline{" "}
                          <span className="font-mono tabular-nums">
                            {formatDate(c.registrationDeadline)}
                          </span>
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">Belum menandai lomba apa pun.</p>
          )}
        </section>
      </div>
    </main>
  );
}
