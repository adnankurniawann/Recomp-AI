"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { InviteButton } from "@/components/invite/invite-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { inviteTemplate } from "@/lib/invites/template";
import type { RankingCandidate, RankingRole, RecommendationFeedback } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";

/** What the invite message needs about the team (F-INV-01). */
export interface InviteContext {
  teamName: string;
  leaderName: string;
  competitionName: string;
  /** Called after an invite is sent, so the row and the sheet both show "Menunggu respon". */
  onInvited?: (profileId: string) => void;
}

export interface CandidateItemProps {
  candidate: RankingCandidate;
  role: Pick<RankingRole, "id" | "name" | "colorKey">;
  invite: InviteContext;
  /** Opens the ProfileSheet (F-RNK-03). */
  onOpenProfile: () => void;
  /** Saves "Cocok" / "Kurang cocok" (F-RNK-05). Resolves false when saving failed. */
  onFeedback?: (value: RecommendationFeedback) => Promise<boolean>;
}

export function candidateOrigin(p: RankingCandidate["profile"]) {
  return [p.campus, p.major, p.entryYear ? `angkatan ${p.entryYear}` : null]
    .filter(Boolean)
    .join(" · ");
}

/** Avatar, name with the "Simulasi" badge, campus, major and entry year. */
export function CandidateIdentity({
  candidate: { profile: p },
  onOpenProfile,
}: Pick<CandidateItemProps, "candidate" | "onOpenProfile">) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={p.fullName} src={p.avatarUrl} size={40} colorKey={p.preferredRoles[0]} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile();
            }}
            className="truncate rounded-sm text-left font-medium text-ink-strong hover:underline focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            {p.fullName}
          </button>
          {p.isSimulated && <SimulatedBadge />}
        </div>
        <p className="text-[13px] text-ink-3">{candidateOrigin(p)}</p>
      </div>
    </div>
  );
}

/** Required skills: the ones the candidate has in green, the missing ones grey and dashed. */
export function CandidateSkills({
  candidate: c,
  className,
}: {
  candidate: RankingCandidate;
  className?: string;
}) {
  if (c.matchedRequired.length + c.missingRequired.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Skill wajib">
      {c.matchedRequired.map((s) => (
        <li key={s.skillId}>
          <SkillChip name={s.name} hasEvidence={s.hasEvidence} state="matched" />
        </li>
      ))}
      {c.missingRequired.map((s) => (
        <li key={s.skillId}>
          <SkillChip name={s.name} state="missing" />
          <span className="sr-only">belum dimiliki</span>
        </li>
      ))}
    </ul>
  );
}

/** "Undang" for this candidate and role, with the message template filled in (F-INV-01). */
export function CandidateInvite({
  candidate: c,
  role,
  invite,
  className,
}: Omit<CandidateItemProps, "onOpenProfile"> & { className?: string }) {
  return (
    <InviteButton
      teamRoleId={role.id}
      roleName={role.name}
      colorKey={role.colorKey}
      candidate={{ id: c.profile.id, fullName: c.profile.fullName }}
      defaultMessage={inviteTemplate({
        candidateName: c.profile.fullName,
        leaderName: invite.leaderName,
        teamName: invite.teamName,
        competitionName: invite.competitionName,
        roleName: role.name,
        topReason: c.reasons[0]?.text,
      })}
      inviteStatus={c.inviteStatus}
      onSent={() => invite.onInvited?.(c.profile.id)}
      className={className}
    />
  );
}

/** "Profil" and "Undang". The invite turns into "Menunggu respon" once sent. */
export function CandidateActions({
  onOpenProfile,
  className,
  ...props
}: CandidateItemProps & { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        className="h-11 md:h-8"
        onClick={onOpenProfile}
        aria-label={`Lihat profil ${props.candidate.profile.fullName}`}
      >
        Profil
      </Button>
      <CandidateInvite {...props} />
    </div>
  );
}

const FEEDBACK_OPTIONS = [
  {
    value: "fit",
    label: "Cocok",
    Icon: ThumbsUp,
    on: "border-success bg-success-50 text-success-ink",
  },
  {
    value: "not_fit",
    label: "Kurang cocok",
    Icon: ThumbsDown,
    on: "border-danger bg-danger-50 text-danger-ink",
  },
] as const;

/**
 * "Cocok" and "Kurang cocok" (F-RNK-05): the team's opinion of this recommendation, kept for the
 * trial metrics (PRD §17). The choice shows at once and rolls back if saving fails.
 */
export function CandidateFeedback({
  candidate: c,
  onFeedback,
  className,
}: Pick<CandidateItemProps, "candidate" | "onFeedback"> & { className?: string }) {
  const [value, setValue] = useState<RecommendationFeedback | null>(c.feedback);
  const [pending, setPending] = useState(false);
  if (!onFeedback) return null;

  async function choose(next: RecommendationFeedback) {
    if (pending || next === value || !onFeedback) return;
    const before = value;
    setValue(next);
    setPending(true);
    const saved = await onFeedback(next);
    setPending(false);
    if (!saved) setValue(before);
  }

  return (
    <div
      role="group"
      aria-label={`Apakah ${c.profile.fullName} cocok untuk role ini?`}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {FEEDBACK_OPTIONS.map(({ value: v, label, Icon, on }) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          disabled={pending}
          onClick={() => choose(v)}
          className={cn(
            "tap-target inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none disabled:opacity-60",
            value === v
              ? on
              : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
          )}
        >
          <Icon aria-hidden size={14} strokeWidth={1.75} />
          {label}
        </button>
      ))}
    </div>
  );
}
