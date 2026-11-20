import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROLE_LABELS, WORK_TIME_LABELS } from "@/lib/constants";
import type { PublicProfile } from "@/lib/profile/public";
import { cn } from "@/lib/utils";

type SummaryProfile = Pick<
  PublicProfile,
  | "fullName"
  | "avatarUrl"
  | "campus"
  | "major"
  | "entryYear"
  | "bio"
  | "preferredRoles"
  | "hoursPerWeek"
  | "goal"
  | "workTime"
  | "openToInvite"
  | "isSimulated"
>;

const GOAL_TEXT = { win: "Target juara", learn: "Ingin belajar" } as const;

interface ProfileSummaryProps {
  profile: SummaryProfile;
  /** 120 on the profile page, 72 in the profile sheet (PRD §10.6). */
  avatarSize?: number;
  /** `stacked` puts the photo above the text (profile page column); `row` beside it (sheet). */
  layout?: "stacked" | "row";
  /** `h1` on the profile page; `h2` inside a sheet or dialog that has its own title. */
  headingAs?: "h1" | "h2";
  className?: string;
}

/** Who the student is: photo, name, campus, preferred roles, availability, bio (PRD F-PRF-06). */
export function ProfileSummary({
  profile: p,
  avatarSize = 120,
  layout = "stacked",
  headingAs: Heading = "h1",
  className,
}: ProfileSummaryProps) {
  const origin = [p.campus, p.major, p.entryYear ? `angkatan ${p.entryYear}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex gap-4",
        layout === "stacked" ? "flex-col" : "flex-row items-start",
        className,
      )}
    >
      <Avatar
        name={p.fullName}
        src={p.avatarUrl}
        size={avatarSize}
        colorKey={p.preferredRoles[0]}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
              {p.fullName}
            </Heading>
            {p.isSimulated && <SimulatedBadge />}
          </div>
          {origin && <p className="text-sm text-ink-2">{origin}</p>}
        </div>

        {p.preferredRoles.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Role yang diminati">
            {p.preferredRoles.map((role) => (
              <li key={role}>
                <Chip color={role}>{ROLE_LABELS[role]}</Chip>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-ink-2">
          {p.openToInvite ? (
            <StatusBadge tone="success">Terbuka untuk diajak</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Sedang tidak mencari tim</StatusBadge>
          )}
          <span>
            <span className="font-mono tabular-nums">{p.hoursPerWeek}</span> jam/minggu
          </span>
          <span aria-hidden>·</span>
          <span>{GOAL_TEXT[p.goal]}</span>
          <span aria-hidden>·</span>
          <span>{WORK_TIME_LABELS[p.workTime]}</span>
        </div>

        {p.bio && <p className="text-sm leading-relaxed text-ink">{p.bio}</p>}
        <p className="text-xs text-ink-3">Data diisi oleh pengguna</p>
      </div>
    </div>
  );
}
