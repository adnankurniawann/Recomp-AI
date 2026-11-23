import { GraduationCap, Mail, MessageCircle, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/learn/course-card";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROLE_COLORS } from "@/lib/constants";
import { INVITE_STATUS } from "@/lib/invites/status";
import { BOOKING_STATUS } from "@/lib/mentors/booking";
import { formatRupiah } from "@/lib/format/currency";
import { formatSlot } from "@/lib/format/date";
import { whatsappUrl } from "@/lib/format/phone";
import { roleSourceLabel } from "@/lib/format/role-source";
import type { DashboardRole, TeamDashboard } from "@/lib/team/queries";
import { cn } from "@/lib/utils";
import { MemberRoleSelect } from "./member-role-select";

// The parts of the team dashboard /tim/[id] (PRD F-TEM-03, §10.4). Server components.

/** One role: its members when filled, its source and required skills when not. */
export function RoleRow({
  role,
  team,
  canInvite,
}: {
  role: DashboardRole;
  team: Pick<TeamDashboard, "id" | "competition">;
  canInvite: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", ROLE_COLORS[role.colorKey].solid)}
        />
        <h3 className="min-w-0 flex-1 truncate font-medium text-ink-strong">{role.name}</h3>
        <span className="font-mono text-xs text-ink-3 tabular-nums">
          {role.members.length}/{role.slots}
        </span>
        <StatusBadge tone={role.filled ? "success" : "warning"}>
          {role.filled ? "Terisi" : "Kosong"}
        </StatusBadge>
      </div>

      {role.members.length > 0 && (
        <ul className="flex flex-col gap-2 pl-4">
          {role.members.map((m) => (
            <li key={m.profileId} className="flex items-center gap-2 text-sm text-ink">
              <Avatar name={m.fullName} src={m.avatarUrl} size={28} colorKey={role.colorKey} />
              <span className="truncate">{m.fullName}</span>
            </li>
          ))}
        </ul>
      )}

      {!role.filled && (
        <div className="flex flex-col gap-2 pl-4">
          <p className="text-[13px] text-ink-3">
            {roleSourceLabel(role, { category: team.competition.category })}
          </p>
          {role.requiredSkills.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label={`Skill wajib ${role.name}`}>
              {role.requiredSkills.map((s) => (
                <li key={s}>
                  <Chip color={role.colorKey}>{s}</Chip>
                </li>
              ))}
            </ul>
          )}
          {canInvite && (
            <Link
              href={`/tim/${team.id}?role=${role.id}#kandidat`}
              scroll={false}
              className={cn(buttonClasses("secondary", "sm"), "self-start")}
            >
              Lihat kandidat
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Everyone in the team, leader first. With `canAssign` the leader moves members between roles.
 * Teammates see each other's WhatsApp and email (F-INV-04); `contact` is null for anyone else.
 */
export function MemberList({ team, canAssign }: { team: TeamDashboard; canAssign: boolean }) {
  const members = team.roles
    .flatMap((r) => r.members.map((m) => ({ ...m, role: r })))
    .sort((a, b) => Number(b.isLeader) - Number(a.isLeader));
  const roleOptions = team.roles.map((r) => ({ id: r.id, name: r.name, full: r.filled }));
  return (
    <ul className="flex flex-col gap-3">
      {members.map((m) => (
        <li key={m.profileId} className="flex items-center gap-3">
          <Avatar name={m.fullName} src={m.avatarUrl} size={36} colorKey={m.role.colorKey} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5">
              {m.username ? (
                <Link
                  href={`/u/${m.username}`}
                  className="truncate text-sm font-medium text-ink-strong hover:underline"
                >
                  {m.fullName}
                </Link>
              ) : (
                <span className="truncate text-sm font-medium text-ink-strong">{m.fullName}</span>
              )}
              {m.isSimulated && <SimulatedBadge />}
              {m.isLeader && <span className="text-[13px] text-ink-3">· Ketua</span>}
            </span>
            {canAssign ? (
              <MemberRoleSelect
                teamId={team.id}
                member={m}
                currentRoleId={m.role.id}
                roles={roleOptions}
              />
            ) : (
              <span className="text-[13px] text-ink-3">{m.role.name}</span>
            )}
            {m.contact && (m.contact.whatsapp || m.contact.email) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {m.contact.whatsapp && (
                  <a
                    href={whatsappUrl(m.contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses("secondary", "sm")}
                  >
                    <MessageCircle aria-hidden size={14} strokeWidth={1.75} />
                    Chat di WhatsApp
                  </a>
                )}
                {m.contact.email && (
                  <a
                    href={`mailto:${m.contact.email}`}
                    className="flex min-w-0 items-center gap-1 text-[13px] text-primary hover:underline"
                  >
                    <Mail aria-hidden size={14} strokeWidth={1.75} className="shrink-0" />
                    <span className="truncate">{m.contact.email}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Invites the leader sent, newest first, with their status. */
export function SentInvites({ invites }: { invites: TeamDashboard["invites"] }) {
  if (invites.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-3">
        <Send aria-hidden size={16} strokeWidth={1.75} />
        Belum ada undangan. Undang kandidat dari role yang masih kosong.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {invites.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 text-ink">
            {i.candidateName} <span className="text-ink-3">· {i.roleName}</span>
          </span>
          <StatusBadge tone={INVITE_STATUS[i.status].tone}>
            {INVITE_STATUS[i.status].label}
          </StatusBadge>
        </li>
      ))}
    </ul>
  );
}

/** Shown when the team is complete, in place of the ranking (PRD §10.4). */
export function CompleteCard({
  suggestions,
}: {
  suggestions: NonNullable<TeamDashboard["suggestions"]>;
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-5 max-sm:px-4">
      <div className="flex flex-col gap-1">
        <SectionLabel>Tim lengkap</SectionLabel>
        <h2 className="text-xl font-semibold text-ink-strong">Semua role sudah terisi</h2>
        <p className="text-ink-2">
          Saatnya bersiap. Ini kursus dan mentor yang cocok untuk lombamu.
        </p>
      </div>

      {suggestions.courses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.courses.map((c) => (
            <li key={c.id} className="flex">
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-ink-3">
          <GraduationCap aria-hidden size={16} strokeWidth={1.75} />
          Belum ada kursus untuk kategori lomba ini.{" "}
          <Link href="/belajar" className="text-primary hover:underline">
            Lihat semua kursus
          </Link>
        </p>
      )}

      {suggestions.mentors.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {suggestions.mentors.map((m) => (
            <li key={m.id}>
              <Link
                href={`/mentor/${m.id}`}
                className="flex items-center gap-3 rounded-md hover:bg-wash focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
              >
                <Avatar name={m.name} src={m.photoUrl} size={40} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-ink-strong">{m.name}</span>
                  <span className="truncate text-[13px] text-ink-3">{m.headline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-ink-3">
          <UserRound aria-hidden size={16} strokeWidth={1.75} />
          Belum ada mentor untuk kategori lomba ini.
        </p>
      )}
    </Card>
  );
}

/** "Sesi mentor" (PRD §10.4, F-MNT-03..04): sessions, the mentor's contact once paid, payments. */
export function MentorSessions({ bookings }: { bookings: TeamDashboard["bookings"] }) {
  if (bookings.length === 0) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
        Belum ada sesi mentor.
        <Link href="/mentor" className="text-primary hover:underline">
          Cari mentor
        </Link>
      </p>
    );
  }
  return (
    <ul className="flex flex-col">
      {bookings.map((b) => {
        const status = BOOKING_STATUS[b.status];
        return (
          <li
            key={b.id}
            className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-ink-strong">{b.serviceName}</span>
                <span className="text-[13px] text-ink-3">
                  <Link href={`/mentor/${b.mentorId}`} className="hover:underline">
                    {b.mentorName}
                  </Link>
                  {b.startsAt && <> · {formatSlot(b.startsAt)}</>}
                </span>
              </div>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>

            {b.contact && (b.contact.whatsapp || b.contact.email) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {b.contact.whatsapp && (
                  <a
                    href={whatsappUrl(b.contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses("secondary", "sm")}
                  >
                    <MessageCircle aria-hidden size={14} strokeWidth={1.75} />
                    Chat mentor di WhatsApp
                  </a>
                )}
                {b.contact.email && (
                  <a
                    href={`mailto:${b.contact.email}`}
                    className="flex min-w-0 items-center gap-1 text-[13px] text-primary hover:underline"
                  >
                    <Mail aria-hidden size={14} strokeWidth={1.75} className="shrink-0" />
                    <span className="truncate">{b.contact.email}</span>
                  </a>
                )}
              </div>
            )}

            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[13px]">
              <dt className="text-ink-3">Total</dt>
              <dd className="text-right font-mono text-ink tabular-nums">
                {formatRupiah(b.price)}
              </dd>
              <dt className="text-ink-3">Biaya platform</dt>
              <dd className="text-right font-mono text-ink tabular-nums">
                {formatRupiah(b.platformFee)}
              </dd>
              <dt className="text-ink-3">Diterima mentor</dt>
              <dd className="text-right font-mono text-ink tabular-nums">
                {formatRupiah(b.mentorShare)}
              </dd>
            </dl>

            {b.status === "pending_payment" && (
              <Link
                href={`/mentor/${b.mentorId}/checkout?booking=${b.id}`}
                className={cn(buttonClasses("secondary", "sm"), "self-start")}
              >
                Lanjutkan pembayaran
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
