"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/masuk/actions";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { APP_NAV, activeHref } from "./nav";

interface SidebarProps {
  /** Shows the Admin group. */
  isAdmin?: boolean;
  /** Mono counts on the right, keyed by item href: `{ "/undangan": 2 }`. */
  counts?: Record<string, number>;
}

/**
 * The app sidebar (PRD §10.0). The groups live in `nav.ts` because Lucide icons can't cross
 * from a Server Component, so callers pass only `isAdmin` and `counts`.
 */
export function Sidebar({ isAdmin = false, counts = {} }: SidebarProps) {
  const pathname = usePathname();
  const current = activeHref(
    pathname,
    APP_NAV.flatMap((g) => g.items.map((i) => i.href)),
  );

  return (
    <div className="flex h-full flex-col px-3 py-2">
      <Logo size="sm" className="mx-2 mt-2 mb-5 self-start" />
      <nav aria-label="Menu utama" className="flex flex-col">
        {APP_NAV.filter((g) => !g.adminOnly || isAdmin).map((group) => (
          <div key={group.label ?? "main"} className="flex flex-col">
            {/* ink-2, not the default ink-3: ink-3 fails AA on surface-2. */}
            {group.label && (
              <SectionLabel className="px-2.5 pt-4 pb-1.5 text-[10px] tracking-[0.2em] text-ink-2">
                {group.label}
              </SectionLabel>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = href === current;
                const count = counts[href];
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none lg:h-9",
                        active
                          ? "bg-surface text-ink-strong shadow-xs"
                          : "text-ink-2 hover:bg-surface/60 hover:text-ink active:bg-surface",
                      )}
                    >
                      <Icon
                        aria-hidden
                        size={18}
                        strokeWidth={1.75}
                        className={cn("shrink-0", active && "text-primary")}
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {count ? (
                        <span className="font-mono text-[11px] text-ink-2 tabular-nums">
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <form action={signOut} className="mt-auto border-t border-line pt-2">
        <button
          type="submit"
          className="flex h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-ink-2 transition-[color,background-color] duration-150 ease-out hover:bg-surface/60 hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none active:bg-surface lg:h-9"
        >
          <LogOut aria-hidden size={18} strokeWidth={1.75} className="shrink-0" />
          Keluar
        </button>
      </form>
    </div>
  );
}
