import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { fixtureRanking, fixtureTeam } from "@/lib/fixtures";
import { cn } from "@/lib/utils";

// The UI/UX role of the simulated team; its ranking comes from lib/matching, not typed by hand.
const role = fixtureTeam.roles.find((r) => r.colorKey === "uiux")!;

const nav = [
  { label: "Dashboard", active: true },
  { label: "Kandidat" },
  { label: "Undangan", count: 2 },
];

function scoreDot(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-primary";
  return "bg-warning";
}

/**
 * The app itself in the landing hero (PRD §10.1): real components with simulated data, not an
 * image. It's a picture to the reader, so it's `inert` (no tab stops) and named as one image.
 */
export function HeroPreview() {
  const candidates = fixtureRanking(role.id).candidates.slice(0, 4);

  return (
    <div
      inert
      role="img"
      aria-label={`Cuplikan aplikasi: kandidat untuk role ${role.name}, diurutkan dengan skor dan alasannya`}
      className="flex overflow-hidden rounded-t-xl border border-b-0 border-line bg-surface text-left shadow-glow"
    >
      <aside className="hidden w-52 shrink-0 flex-col gap-0.5 border-r border-line p-3 md:flex">
        <p className="px-2 pt-1 pb-3 text-sm font-semibold text-ink-strong">{fixtureTeam.name}</p>
        <SectionLabel className="px-2 pb-1 text-[10px]">Tim</SectionLabel>
        {nav.map((item) => (
          <span
            key={item.label}
            className={cn(
              "flex h-8 items-center rounded-sm px-2 text-[13px]",
              item.active ? "bg-surface-2 font-medium text-ink-strong" : "text-ink-2",
            )}
          >
            <span className="flex-1">{item.label}</span>
            {item.count && <span className="font-mono text-[11px]">{item.count}</span>}
          </span>
        ))}
        <SectionLabel className="px-2 pt-4 pb-1 text-[10px]">Persiapan</SectionLabel>
        <span className="flex h-8 items-center px-2 text-[13px] text-ink-2">Belajar</span>
        <span className="flex h-8 items-center px-2 text-[13px] text-ink-2">Mentor</span>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold tracking-[-0.02em] text-ink-strong">{role.name}</p>
          <StatusBadge tone="primary" className="hidden sm:inline-flex">
            Dari kriteria {role.sourceCriterion} · hal. {role.sourcePage}
          </StatusBadge>
          <SimulatedBadge className="ml-auto" />
        </div>
        <ul className="flex flex-col gap-2">
          {candidates.map((c) => (
            <li
              key={c.profile.id}
              className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
            >
              <Avatar name={c.profile.fullName} colorKey="uiux" size={36} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-ink-strong">
                  {c.profile.fullName}
                </span>
                <span className="truncate text-xs text-ink-3">{c.reasons[0]?.text}</span>
              </div>
              <span className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-line px-2">
                <span aria-hidden className={cn("size-2 rounded-full", scoreDot(c.score))} />
                <span className="font-mono text-[15px] text-ink-strong tabular-nums">
                  {c.score}
                </span>
              </span>
              <Button size="sm" className="hidden sm:inline-flex">
                Undang
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
