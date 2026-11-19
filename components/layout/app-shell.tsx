"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "./logo";

interface AppShellProps {
  /** Usually `<Sidebar />`. */
  sidebar: ReactNode;
  /** The right part of the 60 px top bar: breadcrumb, search, bell, avatar. */
  topbar?: ReactNode;
  children: ReactNode;
}

/**
 * Logged-in frame (PRD §9.4, §10.0): a 232 px sidebar on `surface-2` and the page in a `bg` panel
 * with a `line` border and 16 px radius. Below 1024 px the sidebar opens from a menu button.
 */
export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Close the drawer once a link in it is followed.
  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as Element).closest("a")) setOpen(false);
  };

  return (
    <div className="min-h-dvh bg-surface-2 lg:flex lg:p-4">
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-[232px] shrink-0 overflow-y-auto lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal aria-label="Menu">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink-strong/40"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative h-full w-[264px] max-w-[85vw] overflow-y-auto bg-surface-2 shadow-pop"
            onClick={closeOnLink}
          >
            <IconButton
              autoFocus
              label="Tutup menu"
              icon={<X aria-hidden size={18} strokeWidth={1.75} />}
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3"
            />
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-dvh flex-1 flex-col bg-bg lg:min-h-[calc(100dvh-2rem)] lg:rounded-xl lg:border lg:border-line">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 lg:h-[60px] lg:px-6">
            <Logo size="sm" className="lg:hidden" />
            <div className="flex min-w-0 flex-1 items-center gap-3">{topbar}</div>
            <IconButton
              label="Buka menu"
              icon={<Menu aria-hidden size={18} strokeWidth={1.75} />}
              onClick={() => setOpen(true)}
              aria-expanded={open}
              className="size-11 lg:hidden"
            />
          </header>
          <div className="flex-1 p-4 lg:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
