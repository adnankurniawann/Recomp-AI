import { ArrowUpRight, FolderGit2, Globe, Palette, PenTool, type LucideIcon } from "lucide-react";
import {
  PORTFOLIO_LINK_LABELS,
  portfolioLinkKind,
  type PortfolioLinkKind,
} from "@/lib/profile/portfolio";
import type { PublicPortfolioItem } from "@/lib/profile/public";
import { cn } from "@/lib/utils";

const COVER_ICONS: Record<PortfolioLinkKind, LucideIcon> = {
  github: FolderGit2,
  figma: PenTool,
  behance: Palette,
  other: Globe,
};

interface PortfolioGridProps {
  items: PublicPortfolioItem[];
  /** 2 in the profile sheet, 3 on the profile page (PRD §9.7). */
  columns?: 2 | 3;
  limit?: number;
}

/** Portfolio cards that open the work's link in a new tab (PRD F-PRF-04, §10.6). */
export function PortfolioGrid({ items, columns = 3, limit }: PortfolioGridProps) {
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3")}>
      {shown.map((item) => {
        const kind = portfolioLinkKind(item.url);
        const Icon = COVER_ICONS[kind];
        return (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-colors duration-150 ease-out hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
            >
              <div className="aspect-video w-full overflow-hidden border-b border-line bg-wash">
                {item.coverUrl ? (
                  // Covers come from the public `portfolio` bucket.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-primary-hover">
                    <Icon aria-hidden size={28} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{PORTFOLIO_LINK_LABELS[kind]}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="flex items-start justify-between gap-2 font-medium text-ink-strong">
                  <span className="line-clamp-2">{item.title}</span>
                  <ArrowUpRight
                    aria-hidden
                    size={16}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0 text-ink-3 group-hover:text-primary"
                  />
                </p>
                {item.description && (
                  <p className="line-clamp-3 text-sm text-ink-2">{item.description}</p>
                )}
                {item.skillNames.length > 0 && (
                  <p className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {item.skillNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2 text-xs font-medium text-ink-2"
                      >
                        {name}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <span className="sr-only">(buka di tab baru)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
