import {
  CircleCheck,
  CircleDot,
  Clock,
  Link2,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Reason, ReasonIcon } from "@/lib/matching/types";
import { cn } from "@/lib/utils";

// Icon and colour per reason (PRD §7.4). Coloured icons use the `-ink` shades, like text.
const ICONS: Record<ReasonIcon, { icon: LucideIcon; className: string }> = {
  check: { icon: CircleCheck, className: "text-success-ink" },
  "check-partial": { icon: CircleDot, className: "text-warning-ink" },
  link: { icon: Link2, className: "text-primary" },
  trophy: { icon: Trophy, className: "text-warning-ink" },
  clock: { icon: Clock, className: "text-success-ink" },
  "clock-short": { icon: Clock, className: "text-warning-ink" },
  star: { icon: Star, className: "text-primary" },
  people: { icon: Users, className: "text-ink-2" },
};

interface ReasonListProps {
  reasons: Reason[];
  /** 3 on candidate rows and cards; all of them in the profile sheet (PRD §7.4). */
  limit?: number;
  className?: string;
}

/** Why a candidate fits, strongest factor first, one icon per line. Written by code, never an LLM. */
export function ReasonList({ reasons, limit, className }: ReasonListProps) {
  const shown = limit ? reasons.slice(0, limit) : reasons;
  if (shown.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {shown.map((r, i) => {
        const { icon: Icon, className: tone } = ICONS[r.icon];
        return (
          <li
            key={`${r.code}-${i}`}
            className="flex items-start gap-2 text-[13px] leading-5 text-ink-2"
          >
            <Icon
              aria-hidden
              size={15}
              strokeWidth={1.75}
              className={cn("mt-0.5 shrink-0", tone)}
            />
            <span>{r.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
