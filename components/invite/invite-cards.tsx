import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format/date";
import type { InviteView } from "@/lib/invites/queries";
import { INVITE_STATUS } from "@/lib/invites/status";
import { CancelInviteButton, RespondButtons } from "./invite-actions";

function Meta({ invite }: { invite: InviteView }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-ink-2">
        {invite.competition ? (
          <Link
            href={`/lomba/${invite.competition.slug}`}
            className="font-medium text-ink hover:text-primary focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            {invite.competition.name}
          </Link>
        ) : (
          "Lomba tidak tersedia"
        )}
        <span aria-hidden> · </span>
        <time dateTime={invite.createdAt}>{formatRelativeTime(invite.createdAt)}</time>
      </p>
      <StatusBadge tone={INVITE_STATUS[invite.status].tone}>
        {INVITE_STATUS[invite.status].label}
      </StatusBadge>
    </div>
  );
}

function RoleLine({ role }: { role: NonNullable<InviteView["role"]> }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        <Chip color={role.colorKey}>{role.name}</Chip>
        <span className="inline-flex items-center gap-1">
          <Clock aria-hidden size={14} strokeWidth={1.75} className="text-ink-3" />
          <span className="font-mono tabular-nums">{role.hoursPerWeek}</span> jam/minggu
        </span>
      </div>
      {role.requiredSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-3">Skill wajib:</span>
          {role.requiredSkills.map((s) => (
            <SkillChip key={s.name} name={s.name} level={s.minLevel} />
          ))}
        </div>
      )}
    </div>
  );
}

/** An invite to the student (PRD F-INV-02): team, role, members, message, "Terima" and "Tolak". */
export function IncomingInviteCard({ invite, hasTeam }: { invite: InviteView; hasTeam: boolean }) {
  const teamName = invite.team?.name ?? "tim ini";
  return (
    <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
      <Meta invite={invite} />
      <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink-strong">
        Tim {teamName} mengajakmu jadi {invite.role?.name ?? "anggota"}
      </h3>
      {invite.role && <RoleLine role={invite.role} />}

      {invite.members.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-3">Anggota saat ini</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {invite.members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-ink">
                <Avatar name={m.fullName} src={m.avatarUrl} colorKey={m.colorKey} size={28} />
                <span>
                  {m.fullName}
                  {m.isLeader && <span className="text-ink-3"> · ketua</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invite.message && (
        <figure className="flex flex-col gap-1.5 rounded-lg bg-surface-2 p-3">
          <figcaption className="flex items-center gap-1.5 text-xs text-ink-2">
            Pesan dari {invite.sender?.fullName ?? "ketua tim"}
            {invite.aiDrafted && (
              <span className="inline-flex items-center gap-1 text-ink-2">
                · <Sparkles aria-hidden size={12} strokeWidth={1.75} /> Dibuat AI
              </span>
            )}
          </figcaption>
          <blockquote className="text-sm leading-relaxed whitespace-pre-line text-ink">
            {invite.message}
          </blockquote>
        </figure>
      )}

      {invite.status === "pending" && (
        <RespondButtons inviteId={invite.id} teamName={teamName} hasTeam={hasTeam} />
      )}
    </Card>
  );
}

/** An invite the student sent as a leader: who, which role, its status, and "Batalkan" while pending. */
export function SentInviteCard({ invite }: { invite: InviteView }) {
  const c = invite.candidate;
  return (
    <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
      <Meta invite={invite} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c?.fullName ?? "?"} src={c?.avatarUrl} colorKey={c?.colorKey} size={40} />
          <div className="flex min-w-0 flex-col">
            {c?.username ? (
              <Link
                href={`/u/${c.username}`}
                className="truncate font-medium text-ink-strong hover:text-primary focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
              >
                {c.fullName}
              </Link>
            ) : (
              <span className="truncate font-medium text-ink-strong">
                {c?.fullName ?? "Kandidat"}
              </span>
            )}
            <span className="text-sm text-ink-2">Tim {invite.team?.name ?? "-"}</span>
          </div>
        </div>
        {invite.status === "pending" && <CancelInviteButton inviteId={invite.id} />}
      </div>
      {invite.role && <RoleLine role={invite.role} />}
    </Card>
  );
}
